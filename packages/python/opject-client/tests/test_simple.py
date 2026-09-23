import pytest

from opject_client import Client


SOURCE = '''
class Example:
    def read(self):
        return 12
'''


def test_register_require_remove(transport):
    client = Client('http://opject.test', 'opject-tests')
    assert client.register('example', SOURCE) is True
    assert client.require('example').read() == 12
    assert client.remove('example') is True


def test_exec_keeps_module_globals_and_named_classes(transport):
    client = Client('http://opject.test', 'opject-tests')
    assert client.register('globals', 'ANSWER = 12\n' + SOURCE.replace('return 12', 'return ANSWER'))
    assert client.require('globals', name='Example').read() == 12


def test_rejects_invalid_token(transport):
    client = Client('http://opject.test', 'wrong')
    assert client.register('forbidden', SOURCE) is False
    with pytest.raises(Exception, match='no object data'):
        client.require('forbidden')


def test_rejects_failed_integrity_check(transport, monkeypatch):
    client = Client('http://opject.test', 'opject-tests')
    assert client.register('tampered', SOURCE)

    def post(url, **kwargs):
        if url.endswith('/check'):
            kwargs['json']['sha'] = 'wrong'
        return transport(url, **kwargs)

    monkeypatch.setattr('requests.post', post)
    with pytest.raises(Exception, match='did not pass check'):
        client.require('tampered')
    assert client.require('tampered', skip_check=True).read() == 12


def test_detects_first_class_after_other_code_and_with_bases(transport):
    client = Client('http://opject.test', 'opject-tests')
    assert client.register('bases', 'import os\n\nclass Base:\n    pass\n\nclass Example(Base):\n    def read(self):\n        return 12\n')
    assert type(client.require('bases')).__name__ == 'Base'
    assert client.register('preceded', 'ANSWER = 12\n' + SOURCE.replace('return 12', 'return ANSWER'))
    assert client.require('preceded').read() == 12


def test_reports_missing_class(transport):
    client = Client('http://opject.test', 'opject-tests')
    assert client.register('no-class', 'ANSWER = 12')
    with pytest.raises(Exception, match='no class found'):
        client.require('no-class')
