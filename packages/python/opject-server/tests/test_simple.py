# Run with
# python -m tests.test_simple


#region imports
from opject_server import Server as OpjectServer
#endregion imports



#region module
test_token = '__TESTS__'

def verify_token(
    token,
):
    return token == test_token


server = OpjectServer(
    verify_token=verify_token
)

server.start(7766)
#endregion module
