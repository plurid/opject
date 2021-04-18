from multiprocessing import Process
from flask import Flask

from .endpoints import (
    endpoint_require,
    endpoint_register,
    endpoint_check,
    endpoint_remove,
)



class Server:
    def __init__(
        self,
        verify_token = None,
        get_object = None,
        get_metadata = None,
        register_object = None,
        register_metadata = None,
        remove_object = None,
    ):
        self.custom_verify_token = verify_token
        self.custom_get_object = get_object
        self.custom_get_metadata = get_metadata
        self.custom_register_object = register_object
        self.custom_register_metadata = register_metadata
        self.custom_remove_object = remove_object

        self.app = Flask(__name__)
        self.__handle_endpoints()

    def start(
        self,
        port: int,
        debug: bool = False,
    ):
        self.port = port
        self.app.run(
            port=port,
            debug=debug,
        )

    def close(
        self,
    ):
        if self.port:
            print(f"Opject Server closed on port {self.port}")
            server = Process(target=self.app.run)
            if server:
                server.terminate()
        else:
            print("Opject Server has not been started.")


    def __handle_endpoints(
        self,
    ):
        EndpointRequire = endpoint_require(self.custom_get_object)
        EndpointRequire.register(self.app)

        EndpointRegister = endpoint_register(self.custom_get_object)
        EndpointRegister.register(self.app)

        EndpointCheck = endpoint_check(self.custom_get_object)
        EndpointCheck.register(self.app)

        EndpointRemove = endpoint_remove(self.custom_get_object)
        EndpointRemove.register(self.app)
