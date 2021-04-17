import re

import requests

from typing import Any, Optional



class Client:
    def __init__(
        self,
        endpoint: str,
        token: str,
        require_route: str = '/require',
        register_route: str = '/register',
        check_route: str = '/check',
        remove_route: str = '/remove',
    ) -> None:
        self.endpoint = endpoint
        self.token = token
        self.require_url = endpoint + require_route
        self.register_url = endpoint + register_route
        self.check_url = endpoint + check_route
        self.remove_url = endpoint + remove_route


    def require(
        self,
        id: str,
        name: Optional[str],
    ) -> Any:
        object_name = name

        response = requests.post(
            self.require_url,
            headers = {
                'Authorization': 'Bearer %s' % self.token,
            },
            json = {
                'id': id,
            },
        )
        response_data = response.json()

        if not object_name:
            match = re.search("^\s+class (\w+):", response_data["object"])
            if match:
                object_name = match[1]

        exec(response_data["object"])
        obj = eval('%s()' % object_name)
        return obj


    def register(
        self,
        id: str,
        data: str,
        strip: bool = True,
    ) -> Any:
        if strip:
            data = data.strip() + '\n'

        response = requests.post(
            self.register_url,
            headers = {
                'Authorization': 'Bearer %s' % self.token,
            },
            json = {
                'id': id,
                'data': data,
            },
        )
        response_data = response.json()

        return response_data["registered"]


    def remove(
        self,
        id: str,
    ):
        response = requests.post(
            self.remove_url,
            headers = {
                'Authorization': 'Bearer %s' % self.token,
            },
            json = {
                'id': id,
            },
        )
        response_data = response.json()

        return response_data["removed"]
