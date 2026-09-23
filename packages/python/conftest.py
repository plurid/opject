from urllib.parse import urlsplit

import pytest
import requests

from opject_server import Server
from opject_server import endpoints


@pytest.fixture
def server_app(tmp_path, monkeypatch):
    monkeypatch.setattr(endpoints, 'objects_path', str(tmp_path / 'objects'))
    server = Server(verify_token=lambda token: token == 'opject-tests')
    server.app.config['TESTING'] = True
    return server.app


@pytest.fixture
def transport(server_app, monkeypatch):
    """Route requests through the real Flask application without an external server."""
    client = server_app.test_client()

    def post(url, **kwargs):
        result = client.post(
            urlsplit(url).path,
            headers=kwargs.get('headers'),
            json=kwargs.get('json'),
            follow_redirects=True,
        )
        response = requests.Response()
        response.status_code = result.status_code
        response.headers.update(result.headers)
        response._content = result.data
        response.url = url
        return response

    monkeypatch.setattr(requests, 'post', post)
    return post
