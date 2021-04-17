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
    Object Passing Protocol
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
+ `Python`

The `opject server` can serve any kind of object. However, depending on the preferred language, a specific `opject server` can be used for

+ [`NodeJS`](https://github.com/plurid/opject/tree/master/packages/javascript/opject-server)
+ `Python`



## Install

Install using

``` bash
npm install @plurid/opject-server
```

or

``` bash
yarn add @plurid/opject-server
```

Install the peer dependencies

``` bash
@plurid/deon @plurid/plurid-functions express body-parser crypto
```



## Usage

A simple `opject server` will only require passing a `verifyToken` function and `start`ing the server.


``` typescript
import OpjectServer from '@plurid/opject-server';


const opjectServer = new OpjectServer({
    verifyToken: async (
        token,
    ) => {
        if (token === '__TESTS__') {
            return true;
        }

        return false;
    },
});

const PORT = 7766;


opjectServer.start(PORT);
```

The `opject` server will use the local filesystem for storing data.

Custom functions can be passed to the `opject` server to implement any kind of logic handling following the interfaces

``` typescript
export type VerifyToken = (
    token: string,
) => Promise<boolean>;

export type GetObject = (
    id: string,
) => Promise<string | undefined>;

export type GetMetadata = (
    id: string,
) => Promise<OpjectMetadata | undefined>;

export type RegisterObject = (
    id: string,
    data: string,
) => Promise<boolean>;

export type RegisterMetadata = (
    id: string,
    data: OpjectMetadata,
) => Promise<boolean>;

export type RemoveObject = (
    id: string,
) => Promise<boolean>;

export interface OpjectServerConfiguration {
    verifyToken: VerifyToken;
    getObject?: GetObject;
    getMetadata?: GetMetadata;
    registerObject?: RegisterObject;
    registerMetadata?: RegisterMetadata;
    removeObject?: RemoveObject;
    options?: OpjectServerPartialOptions;
}
```



## Packages

<a target="_blank" href="https://www.npmjs.com/package/@plurid/opject-client">
    <img src="https://img.shields.io/npm/v/@plurid/opject.svg?logo=npm&colorB=1380C3&style=for-the-badge" alt="Version">
</a>

[@plurid/opject-client][javascript-opject-client] • `JavaScript` opject client

[javascript-opject-client]: https://github.com/plurid/opject/tree/master/packages/javascript/opject-client


<a target="_blank" href="https://www.npmjs.com/package/@plurid/opject-server">
    <img src="https://img.shields.io/npm/v/@plurid/opject.svg?logo=npm&colorB=1380C3&style=for-the-badge" alt="Version">
</a>

[@plurid/opject-server][javascript-opject-server] • `JavaScript` opject server

[javascript-opject-server]: https://github.com/plurid/opject/tree/master/packages/javascript/opject-server



## [Codeophon](https://github.com/ly3xqhl8g9/codeophon)

+ licensing: [delicense](https://github.com/ly3xqhl8g9/delicense)
+ versioning: [αver](https://github.com/ly3xqhl8g9/alpha-versioning)
