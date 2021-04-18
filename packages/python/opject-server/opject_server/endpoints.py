from flask import request
from flask_classful import FlaskView



def endpoint_require(
    customs,
):
    class EndpointRequire(FlaskView):
        route_base = '/require'

        def post(self):
            request_data = request.get_json()
            object_id = request_data['id']

            custom_get_object = customs['get_object']
            if custom_get_object:
                response = custom_get_object(object_id)
                return response

            response = {
                'object': '',
            }
            return response

    return EndpointRequire


def endpoint_register(
    customs,
):
    class EndpointRegister(FlaskView):
        route_base = '/register'

        def post(self):
            request_data = request.get_json()
            object_id = request_data['id']
            object_data = request_data['data']
            object_dependencies = request_data['dependencies']

            response = {
                'registered': False,
            }
            return response

    return EndpointRegister


def endpoint_check(
    customs,
):
    class EndpointCheck(FlaskView):
        route_base = '/check'

        def post(self):
            request_data = request.get_json()
            object_id = request_data['id']
            object_sha = request_data['sha']

            response = {
                'checked': False,
            }
            return response

    return EndpointCheck


def endpoint_remove(
    customs,
):
    class EndpointRemove(FlaskView):
        route_base = '/remove'

        def post(self):
            request_data = request.get_json()
            object_id = request_data['id']

            response = {
                'removed': False,
            }
            return response

    return EndpointRemove
