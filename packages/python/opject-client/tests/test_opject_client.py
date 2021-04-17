# Run with
# python -m tests.simple


#region imports
from opject_client import Client as OpjectClient
#endregion imports



#region module
endpoint='http://localhost:7766'
token='__TESTS__'


def test_simple():
    opject_client = OpjectClient(
        endpoint=endpoint,
        token=token,
    )
    opject_client.register(
        'SomeOpject',
        'class SomeOpject:\n\tdef __init__(self):\n\t\tself.internal = 12\n\tdef read(self):\n\t\treturn self.internal\n',
    )
    some_opject = opject_client.require('SomeOpject')
    print(some_opject.read())
#endregion module



#region runner
if __name__ == '__main__':
    test_simple()
#endregion runner
