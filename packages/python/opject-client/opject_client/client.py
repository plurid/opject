import requests



class Client:
    __init__(
        self,
        url: str,
        token: str,
        require_route: str = '/require',
        register_route: str = '/register',
        check_route: str = '/check',
        remove_route: str = '/remove',
    ):
        self.url = url
        self.token = token
        self.require_url = url + require_route
        self.register_url = url + register_route
        self.check_url = url + check_route
        self.remove_url = url + remove_route


    def request(
        self,
        opject_id: str,
    ):
        object_name = opject_id

        response = requests.post(
            self.require_url,
            json = {
                'id': opject_id
            }
        )
        response_data = response.json()

        exec(response_data["object"])
        obj = eval('%s()', object_name)
        return obj


    def register(self):
        pass


    def remove(self):
        pass
