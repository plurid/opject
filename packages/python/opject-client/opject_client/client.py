import re
import requests
import hashlib

from typing import (
    Any,
    Optional,
)



class Client:
    def __init__(
        self,
        endpoint: str,
        token: str,
        require_route: str = '/require',
        register_route: str = '/register',
        check_route: str = '/check',
        remove_route: str = '/remove',
        timeout: Optional[float] = 30,
    ) -> None:
        self.endpoint = endpoint
        self.token = token
        self.timeout = timeout
        self.require_url = endpoint + require_route
        self.register_url = endpoint + register_route
        self.check_url = endpoint + check_route
        self.remove_url = endpoint + remove_route


    def require(
        self,
        id: str,
        name: Optional[str] = None,
        skip_check: bool = False,
    ) -> Any:
        object_name = name

        response_data = self.__post(
            self.require_url,
            {
                'id': id,
            },
        )

        object_data = response_data.get('object', None)
        if not object_data:
            raise Exception('Opject: no object data.')

        if not object_name:
            # The first top-level class, with or without base classes.
            match = re.search(r"^class\s+(\w+)\s*[(:]", object_data, re.MULTILINE)
            if not match:
                raise Exception('Opject: no class found in object data, pass a name.')
            object_name = match[1]

        if not skip_check:
            object_hash = hashlib.sha256(
                str.encode(object_data),
            )
            object_computed_sha = object_hash.hexdigest()

            check_data = self.__post(
                self.check_url,
                {
                    'id': id,
                    'sha': object_computed_sha,
                },
            )
            if not check_data.get('checked'):
                raise Exception('Opject: object data did not pass check.')

        namespace: dict[str, Any] = {}
        exec(object_data, namespace)
        if object_name not in namespace:
            raise Exception(f"Opject: object data does not define '{object_name}'.")
        obj = namespace[object_name]()
        return obj


    def register(
        self,
        id: str,
        data: str,
        strip: bool = True,
    ) -> Any:
        if strip:
            data = data.strip() + '\n'

        response_data = self.__post(
            self.register_url,
            {
                'id': id,
                'data': data,
            },
        )

        return response_data.get('registered', False)


    def remove(
        self,
        id: str,
    ):
        response_data = self.__post(
            self.remove_url,
            {
                'id': id,
            },
        )

        return response_data.get('removed', False)


    def __post(
        self,
        url: str,
        data: dict,
    ) -> dict:
        response = requests.post(
            url,
            headers = {
                'Authorization': 'Bearer %s' % self.token,
            },
            json = data,
            timeout = self.timeout,
        )
        response.raise_for_status()

        return response.json()
