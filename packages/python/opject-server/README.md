<p align="center">
    <img src="https://raw.githubusercontent.com/plurid/opject/master/about/identity/opject-logo.png" height="250px">
    <br />
    <br />
    <a target="_blank" href="https://github.com/plurid/opject/blob/master/LICENSE">
        <img src="https://img.shields.io/badge/license-DEL-blue.svg?colorB=1380C3&style=for-the-badge" alt="License: DEL">
    </a>
</p>



<h1 align="center">
    opject
</h1>


<h3 align="center">
    Object Passing Library
</h3>



### Contents

+ [About](#about)
+ [Install](#install)
+ [Usage](#usage)
+ [Packages](#packages)
+ [Codeophon](#codeophon)



## About

`opject` is a specification and implementation for passing `object`s through the network.

An `object` is a self-contained piece of code.

The passing of the object through the network is obtained in 2 steps:

+ a registered object is requested by the `opject client` from the `opject server`;
+ the `opject client` instantiates or runs in a virtual machine the received object.

`opject` has clients for

+ [`NodeJS`](https://github.com/plurid/opject/tree/master/packages/javascript/opject-client)
+ [`Python`](https://github.com/plurid/opject/tree/master/packages/python/opject-client)

The `opject server` can serve any kind of object. However, depending on the preferred language, a specific `opject server` can be used for

+ [`NodeJS`](https://github.com/plurid/opject/tree/master/packages/javascript/opject-server)
+ [`Python`](https://github.com/plurid/opject/tree/master/packages/python/opject-server)

The [`opject registry`](https://github.com/plurid/opject/tree/master/packages/registry) grants extended functionality through a web interface. The registry can be self-hosted or [cloud-hosted](https://opject.plurid.cloud).



## Install

Install by running

``` bash
pip install opject-server
```



## Usage

A simple `opject server` will only require passing a `verify_token` function and `start`ing the server.


``` python
from opject_server import Server as OpjectServer


test_token = '__TESTS__'
port = 7766

def verify_token(
    token,
):
    return token == test_token


server = OpjectServer(
    verify_token=verify_token
)

server.start(
    port=port,
)
```

The `opject` server will use the local filesystem for storing data.

Custom functions can be passed to the `opject` server to implement any kind of logic handling following the interfaces

``` python
def verify_token(
    token: str,
):
    pass

def get_object(
    id: str,
):
    pass

def get_metadata(
    id: str,
):
    pass

def register_object(
    id: str,
    data: str,
):
    pass

def register_metadata(
    id: str,
    data: dict, # { dependencies: str }
):
    pass

def remove_object(
    id: str,
):
    pass
```



## Packages

<a target="_blank" href="https://www.npmjs.com/package/@plurid/opject-client">
    <img src="https://img.shields.io/npm/v/@plurid/opject.svg?logo=npm&colorB=1380C3&style=for-the-badge" alt="Version">
</a>

[@plurid/opject-client-javascript][opject-client-javascript] • `JavaScript` opject client

[opject-client-javascript]: https://github.com/plurid/opject/tree/master/packages/javascript/opject-client


<a target="_blank" href="https://www.npmjs.com/package/@plurid/opject-server">
    <img src="https://img.shields.io/npm/v/@plurid/opject.svg?logo=npm&colorB=1380C3&style=for-the-badge" alt="Version">
</a>

[@plurid/opject-server-javascript][opject-server-javascript] • `JavaScript` opject server

[opject-server-javascript]: https://github.com/plurid/opject/tree/master/packages/javascript/opject-server



<a target="_blank" href="https://pypi.org/project/opject-client">
    <img src="https://img.shields.io/pypi/v/opject-client.svg?logo=pypi&colorB=1380C3&style=for-the-badge" alt="Version">
</a>

[@plurid/opject-client-python][opject-client-python] • `Python` opject client

[opject-client-python]: https://github.com/plurid/opject/tree/master/packages/python/opject-client


<a target="_blank" href="https://pypi.org/project/opject-server">
    <img src="https://img.shields.io/pypi/v/opject-server.svg?logo=pypi&colorB=1380C3&style=for-the-badge" alt="Version">
</a>

[@plurid/opject-server-python][opject-server-python] • `Python` opject server

[opject-server-python]: https://github.com/plurid/opject/tree/master/packages/python/opject-server



## [Codeophon](https://github.com/ly3xqhl8g9/codeophon)

+ licensing: [delicense](https://github.com/ly3xqhl8g9/delicense)
+ versioning: [αver](https://github.com/ly3xqhl8g9/alpha-versioning)
