import os
import hashlib

from flask import request
from flask_classful import FlaskView

from .constants import (
    objects_path,
)
from .utilities import (
    check_token,
    resolve_object_path,
)



def get_object(
    methods,
    object_id,
):
    custom_get_object = methods['get_object']
    if custom_get_object:
        return custom_get_object(object_id)

    object_path = resolve_object_path(
        objects_path,
        object_id,
    )
    if not object_path:
        return None

    try:
        with open(object_path, encoding='utf-8') as object_file:
            return object_file.read()
    except FileNotFoundError:
        return None


def register_object(
    methods,
    object_id,
    object_data,
):
    custom_register_object = methods['register_object']
    if custom_register_object:
        return bool(custom_register_object(object_id, object_data))

    object_path = resolve_object_path(
        objects_path,
        object_id,
    )
    if not object_path:
        return False

    os.makedirs(os.path.dirname(object_path), exist_ok=True)
    with open(object_path, 'w', encoding='utf-8') as object_file:
        object_file.write(object_data)

    return True


def remove_object(
    methods,
    object_id,
):
    custom_remove_object = methods['remove_object']
    if custom_remove_object:
        return bool(custom_remove_object(object_id))

    object_path = resolve_object_path(
        objects_path,
        object_id,
    )
    if not object_path:
        return False

    try:
        os.remove(object_path)
    except FileNotFoundError:
        return False

    return True



def endpoint_require(
    methods,
):
    class EndpointRequire(FlaskView):
        route_base = '/require'
        trailing_slash = False

        def post(self):
            request_data = request.get_json(silent=True)
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

            object_data = get_object(methods, object_id)
            if not object_data:
                return {}

            response = {
                'object': object_data,
            }

            custom_get_metadata = methods['get_metadata']
            if custom_get_metadata:
                metadata = custom_get_metadata(object_id)
                if metadata:
                    response['dependencies'] = metadata.get('dependencies', [])

            return response

    return EndpointRequire


def endpoint_register(
    methods,
):
    class EndpointRegister(FlaskView):
        route_base = '/register'
        trailing_slash = False

        def post(self):
            request_data = request.get_json(silent=True)
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

            registered = register_object(methods, object_id, object_data)

            custom_register_metadata = methods['register_metadata']
            if registered and custom_register_metadata:
                registered = bool(custom_register_metadata(
                    object_id,
                    {
                        'dependencies': object_dependencies or [],
                    },
                ))

            response = {
                'registered': registered,
            }
            return response

    return EndpointRegister


def endpoint_check(
    methods,
):
    class EndpointCheck(FlaskView):
        route_base = '/check'
        trailing_slash = False

        def post(self):
            request_data = request.get_json(silent=True)
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

            object_read_data = get_object(methods, object_id)
            if not object_read_data:
                response = {
                    'checked': False,
                }
                return response

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
        trailing_slash = False

        def post(self):
            request_data = request.get_json(silent=True)
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

            response = {
                'removed': remove_object(methods, object_id),
            }
            return response

    return EndpointRemove
