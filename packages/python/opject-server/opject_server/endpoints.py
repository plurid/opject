def endpoint_require(
    custom_get_object,
):
    return class EndpointRequire(FlaskView):
        route_base = '/require'

        def post(self):
            request_data = request.get_json()
            response = {
                'object': False,
            }
            return response

def endpoint_register(
    custom_get_object,
):
    return class EndpointRegister(FlaskView):
        route_base = '/register'

        def post(self):
            request_data = request.get_json()
            response = {
                'registered': False,
            }
            return response

def endpoint_check(
    custom_get_object,
):
    return class EndpointCheck(FlaskView):
        route_base = '/check'

        def post(self):
            request_data = request.get_json()
            response = {
                'checked': False,
            }
            return response

def endpoint_remove(
    custom_get_object,
):
    return class EndpointRemove(FlaskView):
        route_base = '/remove'

        def post(self):
            request_data = request.get_json()
            response = {
                'removed': False,
            }
            return response
