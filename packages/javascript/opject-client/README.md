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
npm install @plurid/opject-client
```

or

``` bash
yarn add @plurid/opject-client
```

Install the peer dependencies

``` bash
@plurid/plurid-functions cross-fetch
```


## Usage

The `opject` client requires a server. The server can be self-hosted or [cloud-hosted](https://opject.plurid.cloud).

The simplest use-case implies registering an `opject`, retrieving, and running it.

``` typescript
import OpjectClient from '@plurid/opject-client';


const opjectClient = new OpjectClient({
    url: 'http://server.address',
    token: 'secret_token_obtained_from_server',
});

const opjectID = 'some-opject';

const opjectSource = `
class SomeOpject {
    internal = 12;

    read() {
        return this.internal;
    }
}
`;


const main = async () => {
    const registered = await client.register(
        opjectID,
        opjectSource,
    );

    if (!registered) {
        console.log('Opject not registered');
        return;
    }

    const someOpject = await client.request(
        opjectID,
    );

    const value = someOpject.read() // 12
}

main();
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
