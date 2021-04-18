import os
import codecs
import hashlib

from flask import request
from flask_classful import FlaskView

from .constants import (
    objects_path,
)
from .utilities import (
    check_token,
)



def endpoint_require(
    methods,
):
    class EndpointRequire(FlaskView):
        route_base = '/require'

        def post(self):
            request_data = request.get_json()
            if not request_data:
                return {}

            object_id = request_data.get('id', None)
            if not object_id:
                return {}

            valid_token = check_token(
                request.headers.get('Authorization'),
                methods['verify_token'],
            )
            if not valid_token:
                return {}

            custom_get_object = methods['get_object']
            if custom_get_object:
                response = custom_get_object(object_id)
                return response

            object_path = os.path.join(
                objects_path,
                object_id,
            )
            object_file = codecs.open(object_path, 'r', 'utf-8')
            object_read_data = object_file.read()

            response = {
                'object': object_read_data,
            }
            return response

    return EndpointRequire


def endpoint_register(
    methods,
):
    class EndpointRegister(FlaskView):
        route_base = '/register'

        def post(self):
            request_data = request.get_json()
            if not request_data:
                response = {
                    'registered': False,
                }
                return response

            object_id = request_data.get('id', None)
            object_data = request_data.get('data', None)
            object_dependencies = request_data.get('dependencies', None)
            if (
                not object_id
                or not object_data
            ):
                response = {
                    'registered': False,
                }
                return response

            valid_token = check_token(
                request.headers.get('Authorization'),
                methods['verify_token'],
            )
            if not valid_token:
                response = {
                    'registered': False,
                }
                return response

            object_path = os.path.join(
                objects_path,
                object_id,
            )
            os.makedirs(os.path.dirname(object_path), exist_ok=True)
            object_file = open(object_path, 'w+')
            object_file.write(object_data)
            object_file.close()

            response = {
                'registered': True,
            }
            return response

    return EndpointRegister


def endpoint_check(
    methods,
):
    class EndpointCheck(FlaskView):
        route_base = '/check'

        def post(self):
            request_data = request.get_json()
            if not request_data:
                response = {
                    'checked': False,
                }
                return response

            object_id = request_data.get('id', None)
            object_sha = request_data.get('sha', None)
            if not object_id or not object_sha:
                response = {
                    'checked': False,
                }
                return response

            valid_token = check_token(
                request.headers.get('Authorization'),
                methods['verify_token'],
            )
            if not valid_token:
                response = {
                    'checked': False,
                }
                return response

            object_path = os.path.join(
                objects_path,
                object_id,
            )
            object_file = codecs.open(object_path, 'r', 'utf-8')
            object_read_data = object_file.read()

            object_hash = hashlib.sha256(
                str.encode(object_read_data),
            )
            object_computed_sha = object_hash.hexdigest()

            if object_sha != object_computed_sha:
                response = {
                    'checked': False,
                }
                return response

            response = {
                'checked': True,
            }
            return response

    return EndpointCheck


def endpoint_remove(
    methods,
):
    class EndpointRemove(FlaskView):
        route_base = '/remove'

        def post(self):
            request_data = request.get_json()
            if not request_data:
                response = {
                    'removed': False,
                }
                return response

            object_id = request_data.get('id', None)
            if not object_id:
                response = {
                    'removed': False,
                }
                return response

            valid_token = check_token(
                request.headers.get('Authorization'),
                methods['verify_token'],
            )
            if not valid_token:
                response = {
                    'removed': False,
                }
                return response

            object_path = os.path.join(
                objects_path,
                object_id,
            )
            os.remove(object_path)

            response = {
                'removed': True,
            }
            return response

    return EndpointRemove
