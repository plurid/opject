from flask import request
from flask_classful import FlaskView



def endpoint_require(
    custom_get_object,
):
    class EndpointRequire(FlaskView):
        route_base = '/require'

        def post(self):
            request_data = request.get_json()
            response = {
                'object': '',
            }
            return response

    return EndpointRequire


def endpoint_register(
    custom_get_object,
):
    class EndpointRegister(FlaskView):
        route_base = '/register'

        def post(self):
            request_data = request.get_json()
            response = {
                'registered': False,
            }
            return response

    return EndpointRegister


def endpoint_check(
    custom_get_object,
):
    class EndpointCheck(FlaskView):
        route_base = '/check'

        def post(self):
            request_data = request.get_json()
            response = {
                'checked': False,
            }
            return response

    return EndpointCheck


def endpoint_remove(
    custom_get_object,
):
    class EndpointRemove(FlaskView):
        route_base = '/remove'

        def post(self):
            request_data = request.get_json()
            response = {
                'removed': False,
            }
            return response

    return EndpointRemove
