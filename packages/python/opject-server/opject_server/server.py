from flask import Flask, request, jsonify
from flask_classful import FlaskView



class EndpointRequire(FlaskView):
    def post(self):
        pass


class Server:
    def __init__(
        self,
        verify_token = None
        get_object = None
        get_metadata = None
        register_object = None
        register_metadata = None
        remove_object = None
    ):
        self.custom_verify_token = verify_token
        self.custom_get_object = get_object
        self.custom_get_metadata = get_metadata
        self.custom_register_object = register_object
        self.custom_register_metadata = register_metadata
        self.custom_remove_object = remove_object

        self.app = Flask(__name__)
        self.__handle_endpoints()
        pass

    def start(
        self,
        port,
    ):
        app.run()

    def close(
        self,
    ):
        app.run()


    def __handle_endpoints(
        self,
    ):
        pass



server = Flask(__name__)



@server.route('/request', methods=['POST'])
def request():
    response = {
        "object": "",
    }
    return jsonify(response)


@server.route('/register', methods=['POST'])
def register():
    response = {
        "registered": False,
    }
    return jsonify(response)


@server.route('/check', methods=['POST'])
def check():
    response = {
        "checked": False,
    }
    return jsonify(response)


@server.route('/remove', methods=['POST'])
def remove():
    response = {
        "removed": False,
    }
    return jsonify(response)
