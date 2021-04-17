import requests



class Client:
    __init__(
        self,
        endpoint: str,
        token: str,
        require_route: str = '/require',
        register_route: str = '/register',
        check_route: str = '/check',
        remove_route: str = '/remove',
    ):
        self.endpoint = endpoint
        self.token = token
        self.require_url = endpoint + require_route
        self.register_url = endpoint + register_route
        self.check_url = endpoint + check_route
        self.remove_url = endpoint + remove_route


    def request(
        self,
        id: str,
    ):
        object_name = id

        response = requests.post(
            self.require_url,
            json = {
                'id': id,
            },
        )
        response_data = response.json()

        exec(response_data["object"])
        obj = eval('%s()' % object_name)
        return obj


    def register(
        self,
        id: str,
        data: str,
    ):
        response = requests.post(
            self.register_url,
            json = {
                'id': id,
                'data': data,
            },
        )
        response_data = response.json()

        return response_data.registered


    def remove(
        self,
        id: str,
    ):
        response = requests.post(
            self.remove_url,
            json = {
                'id': id,
            },
        )
        response_data = response.json()

        return response_data.removed
