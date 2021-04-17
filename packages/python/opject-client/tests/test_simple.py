# Run with
# python -m tests.test_opject_client


#region imports
import unittest

from opject_client import Client as OpjectClient
#endregion imports



#region module
endpoint = 'http://localhost:7766'
token = '__TESTS__'


class TestOpjectClient(unittest.TestCase):
    def test_simple(self):
        opject_id = 'some-opject-python'
        opject_name = 'SomeOpject'

        opject_client = OpjectClient(
            endpoint = endpoint,
            token = token,
        )
        opject_client.register(
            opject_id,
            # 'class SomeOpject:\n\tdef __init__(self):\n\t\tself.internal = 12\n\tdef read(self):\n\t\treturn self.internal\n',
            """
class SomeOpject:
    def __init__(self):
        self.internal = 12

    def read(self):
        return self.internal
            """,
        )
        some_opject = opject_client.require(
            id = opject_id,
            name = opject_name,
        )
        self.assertEqual(some_opject.read(), 12)
#endregion module



#region runner
if __name__ == '__main__':
    unittest.main()
#endregion runner
