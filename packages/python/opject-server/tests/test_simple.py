import hashlib

import pytest


HEADERS = {'Authorization': 'Bearer opject-tests'}


def test_filesystem_protocol(server_app, tmp_path):
    client = server_app.test_client()

    def post(route, data):
        response = client.post(route, json=data, headers=HEADERS, follow_redirects=True)
        assert response.status_code == 200
        return response.get_json()

    source = 'class Example:\n    value = "café"\n'
    assert post('/register', {'id': 'example', 'data': source}) == {'registered': True}
    assert (tmp_path / 'objects' / 'example').read_text(encoding='utf-8') == source
    assert post('/require', {'id': 'example'}) == {'object': source}
    sha = hashlib.sha256(source.encode()).hexdigest()
    assert post('/check', {'id': 'example', 'sha': sha}) == {'checked': True}
    assert post('/check', {'id': 'example', 'sha': 'wrong'}) == {'checked': False}
    assert post('/remove', {'id': 'example'}) == {'removed': True}
    assert not (tmp_path / 'objects' / 'example').exists()


@pytest.mark.parametrize('route, expected', [
    ('/require', {}),
    ('/register', {'registered': False}),
    ('/check', {'checked': False}),
    ('/remove', {'removed': False}),
])
def test_rejects_empty_requests(server_app, route, expected):
    response = server_app.test_client().post(route, json={}, headers=HEADERS, follow_redirects=True)
    assert response.get_json() == expected


def test_authorization_precedes_storage(server_app, tmp_path):
    response = server_app.test_client().post(
        '/register', json={'id': 'forbidden', 'data': 'source'}, follow_redirects=True,
    )
    assert response.get_json() == {'registered': False}
    assert not (tmp_path / 'objects').exists()


def test_routes_do_not_redirect(server_app):
    response = server_app.test_client().post('/require', json={'id': 'missing'}, headers=HEADERS)
    assert response.status_code == 200


def test_filesystem_storage_stays_inside_objects_path(server_app, tmp_path):
    client = server_app.test_client()
    assert client.post('/register', json={'id': '../escaped', 'data': 'x'}, headers=HEADERS).get_json() == {'registered': False}
    assert not (tmp_path / 'escaped').exists()
    assert client.post('/require', json={'id': '../escaped'}, headers=HEADERS).get_json() == {}
    assert client.post('/remove', json={'id': '/etc/hosts'}, headers=HEADERS).get_json() == {'removed': False}


def test_missing_objects_are_reported_without_errors(server_app):
    client = server_app.test_client()
    assert client.post('/require', json={'id': 'missing'}, headers=HEADERS).get_json() == {}
    assert client.post('/check', json={'id': 'missing', 'sha': 'x'}, headers=HEADERS).get_json() == {'checked': False}
    assert client.post('/remove', json={'id': 'missing'}, headers=HEADERS).get_json() == {'removed': False}


def test_nested_object_ids(server_app, tmp_path):
    client = server_app.test_client()
    assert client.post('/register', json={'id': 'scope/nested', 'data': 'x'}, headers=HEADERS).get_json() == {'registered': True}
    assert (tmp_path / 'objects' / 'scope' / 'nested').read_text() == 'x'


def test_custom_storage_callbacks(tmp_path):
    from opject_server import Server

    objects, metadata = {}, {}
    server = Server(
        verify_token=lambda token: token == 'opject-tests',
        get_object=objects.get,
        get_metadata=metadata.get,
        register_object=lambda id, data: objects.__setitem__(id, data) or True,
        register_metadata=lambda id, data: metadata.__setitem__(id, data) or True,
        remove_object=lambda id: objects.pop(id, None) is not None,
    )
    client = server.app.test_client()

    def post(route, data):
        return client.post(route, json=data, headers=HEADERS).get_json()

    source = 'class Example:\n    pass\n'
    assert post('/register', {'id': 'custom', 'data': source, 'dependencies': ['a']}) == {'registered': True}
    assert objects == {'custom': source}
    assert metadata == {'custom': {'dependencies': ['a']}}
    assert post('/require', {'id': 'custom'}) == {'object': source, 'dependencies': ['a']}
    sha = hashlib.sha256(source.encode()).hexdigest()
    assert post('/check', {'id': 'custom', 'sha': sha}) == {'checked': True}
    assert post('/remove', {'id': 'custom'}) == {'removed': True}
    assert objects == {}
    assert not (tmp_path / 'objects').exists()


def test_start_and_close():
    import threading
    import time

    import requests
    from opject_server import Server

    server = Server(verify_token=lambda token: True)
    server.close()

    thread = threading.Thread(target=server.start, kwargs={'port': 0})
    thread.start()
    while not server.server:
        time.sleep(0.01)
    port = server.server.server_port
    assert requests.post(f'http://127.0.0.1:{port}/require', json={}, timeout=5).json() == {}
    server.close()
    thread.join(timeout=5)
    assert not thread.is_alive()
