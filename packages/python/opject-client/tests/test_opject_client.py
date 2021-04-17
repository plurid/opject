# Run with
# python -m tests.test_delog


#region imports
import unittest

from opject_client import Client as OpjectClient
#endregion imports



#region module
endpoint='http://localhost:7766'
token='__TESTS__'


class TestDelog(unittest.TestCase):
    def test_simple(self):
        opject_client = OpjectClient(
            endpoint=endpoint,
            token=token,
        )
        opject_client.register(
            'some-opject',
            'class SomeOpject:\n\tdef __init__(self):\n\t\tself.internal = 12\n\tdef read(self):\n\t\treturn self.internal\n',
        )
        some_opject = opject_client.require('some-opject')
        print(some_opject.read())
#endregion module


#region runner
if __name__ == '__main__':
    unittest.main()
#endregion runner
