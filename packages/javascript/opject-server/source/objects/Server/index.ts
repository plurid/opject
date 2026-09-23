// #region imports
    // #region libraries
    import path from 'node:path';

    import {
        promises as fs,
    } from 'node:fs';

    import {
        Server,
    } from 'node:http';

    import express, {
        Express,
    } from 'express';

    import DeonLibrary, {
        DEON_MEDIA_TYPE,
    } from '@plurid/deon';

    import { createHash, randomUUID } from 'node:crypto';
    // #endregion libraries


    // #region external
    import {
        environment,

        DEFAULT_SERVER_PORT,
        DEFAULT_SERVER_OPTIONS,

        ENDPOINT_REQUIRE,
        ENDPOINT_REGISTER,
        ENDPOINT_CHECK,
        ENDPOINT_REMOVE,

        OBJECTS_PATH,
        METADATA_PATH,
    } from '../../data/constants';

    import {
        ServerRequest,
        ServerRequestObjectBody,
        ServerRequestRegisterBody,
        ServerRequestCheckBody,
        ServerRequestRemoveBody,

        DebugLevels,

        OpjectServerOptions,
        OpjectServerPartialOptions,
        OpjectServerConfiguration,

        OpjectMetadata,

        VerifyToken,
        GetObject,
        GetMetadata,
        RegisterObject,
        RegisterMetadata,
        RemoveObject,
    } from '../../data/interfaces';
    // #endregion external
// #endregion imports



// #region module
// The legacy DEON package exposes its constructor under `default` in CommonJS.
// Normalize that shape so native ESM and CommonJS consumers use the same parser.
const Deon = (DeonLibrary as typeof DeonLibrary & { default?: typeof DeonLibrary }).default ?? DeonLibrary;

/**
 * Resolves an object ID inside a storage directory.
 * IDs escaping the directory (`../`, absolute paths) resolve to `undefined`.
 */
const resolveStoragePath = (
    directory: string,
    id: string,
) => {
    if (typeof id !== 'string') {
        return;
    }

    const base = path.resolve(directory);
    const resolved = path.resolve(base, id);

    if (!resolved.startsWith(base + path.sep)) {
        return;
    }

    return resolved;
}

class OpjectServer {
    private options: OpjectServerOptions;
    private serverApplication: Express;
    private server: Server | undefined;
    private port: number | string;

    private verifyToken: VerifyToken;
    private customGetObject: GetObject | undefined;
    private customGetMetadata: GetMetadata | undefined;
    private customRegisterObject: RegisterObject | undefined;
    private customRegisterMetadata: RegisterMetadata | undefined;
    private customRemoveObject: RemoveObject | undefined;


    constructor(
        configuration: OpjectServerConfiguration,
    ) {
        this.options = this.handleOptions(configuration?.options);

        this.serverApplication = express();
        this.port = DEFAULT_SERVER_PORT;

        this.verifyToken = configuration.verifyToken;
        this.customGetObject = configuration.getObject;
        this.customGetMetadata = configuration.getMetadata;
        this.customRegisterObject = configuration.registerObject;
        this.customRegisterMetadata = configuration.registerMetadata;
        this.customRemoveObject = configuration.removeObject;

        this.configureServer();

        this.handleEndpoints();

    }


    public start(
        port = this.port,
    ) {
        this.port = port;

        const serverlink = `http://localhost:${port}`;

        if (this.debugAllows('info')) {
            console.info(
                `\n\t[${new Date().toISOString()}] ${this.options.serverName} Started on Port ${port}: ${serverlink}\n`,
            );
        }

        this.server = this.serverApplication.listen(port);

        return this.server;
    }

    public stop() {
        if (this.server) {
            if (this.debugAllows('info')) {
                console.info(
                    `\n\t[${new Date().toISOString()}] ${this.options.serverName} Stopped on Port ${this.port}\n`,
                );
            }

            this.server.close();
        } else {
            if (this.debugAllows('info')) {
                console.info(
                    `\n\t[${new Date().toISOString()}] ${this.options.serverName} Could not be Stopped on Port ${this.port}\n`,
                );
            }
        }
    }

    public handle() {
        return {
            post: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.post(path, ...handlers);

                return this.serverApplication;
            },
            patch: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.patch(path, ...handlers);

                return this.serverApplication;
            },
            put: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.put(path, ...handlers);

                return this.serverApplication;
            },
            delete: (
                path: string,
                ...handlers: express.RequestHandler[]
            ) => {
                this.serverApplication.delete(path, ...handlers);

                return this.serverApplication;
            },
        };
    }

    public instance() {
        return this.serverApplication;
    }


    private handleEndpoints() {
        this.serverApplication.post(ENDPOINT_REQUIRE, (request, response) => {
            this.handleEndpointRequire(request, response);
        });

        this.serverApplication.post(ENDPOINT_REGISTER, (request, response) => {
            this.handleEndpointRegister(request, response);
        });

        this.serverApplication.post(ENDPOINT_CHECK, (request, response) => {
            this.handleEndpointCheck(request, response);
        });

        this.serverApplication.post(ENDPOINT_REMOVE, (request, response) => {
            this.handleEndpointRemove(request, response);
        });
    }

    private async handleEndpointRequire(
        request: express.Request,
        response: express.Response,
    ) {
        const requestID = (request as ServerRequest).requestID || randomUUID();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (000 Start) Handling POST ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (401 Unauthorized) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(401)
                    .send('Unauthorized');
                return;
            }


            if (
                !request.body.id
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(400)
                    .send('Bad Request');
                return;
            }


            const {
                token,
                id: objectID,
            } = request.body as ServerRequestObjectBody;


            const verifiedToken = await this.verifyToken(token);

            if (
                !verifiedToken
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (403 Forbidden) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const objectData = await this.getObject(objectID);
            const objectMetadata = await this.getMetadata(objectID);

            if (
                !objectData
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (404 Not Found) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(404)
                    .send('Not Found');
                return;
            }


            const responseData = {
                object: objectData,
                dependencies: objectMetadata?.dependencies,
            };


            if (
                !request.is(DEON_MEDIA_TYPE)
            ) {
                if (this.debugAllows('info')) {
                    const requestTime = this.computeRequestTime(request);

                    console.info(
                        `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                    );
                }

                response.json(responseData);
                return;
            }


            const deon = new Deon();
            const responseDeon = deon.stringify(responseData);

            response.setHeader(
                'Content-Type',
                DEON_MEDIA_TYPE,
            );

            if (this.debugAllows('info')) {
                const requestTime = this.computeRequestTime(request);

                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                const requestTime = this.computeRequestTime(request);

                console.error(
                    `[${new Date().toISOString()} :: ${requestID}] (500 Server Error) Could not handle POST ${request.path}${requestTime}`,
                    error,
                );
            }

            response
                .status(500)
                .send('Server Error');
            return;
        }
    }

    private async handleEndpointRegister(
        request: express.Request,
        response: express.Response,
    ) {
        const requestID = (request as ServerRequest).requestID || randomUUID();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (000 Start) Handling POST ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (401 Unauthorized) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(401)
                    .send('Unauthorized');
                return;
            }


            if (
                !request.body.id
                || !request.body.data
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(400)
                    .send('Bad Request');
                return;
            }


            const {
                token,
                id: objectID,
                data,
                dependencies,
            } = request.body as ServerRequestRegisterBody;


            const verifiedToken = await this.verifyToken(token);

            if (
                !verifiedToken
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (403 Forbidden) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const registeredObject = await this.registerObject(
                objectID,
                data,
            );

            const registeredMetadata = registeredObject && await this.registerMetadata(
                objectID,
                dependencies,
            );


            const responseData = {
                registered: registeredObject && registeredMetadata,
            };


            if (
                !request.is(DEON_MEDIA_TYPE)
            ) {
                if (this.debugAllows('info')) {
                    const requestTime = this.computeRequestTime(request);

                    console.info(
                        `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                    );
                }

                response.json(responseData);
                return;
            }


            const deon = new Deon();
            const responseDeon = deon.stringify(responseData);

            response.setHeader(
                'Content-Type',
                DEON_MEDIA_TYPE,
            );

            if (this.debugAllows('info')) {
                const requestTime = this.computeRequestTime(request);

                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                const requestTime = this.computeRequestTime(request);

                console.error(
                    `[${new Date().toISOString()} :: ${requestID}] (500 Server Error) Could not handle POST ${request.path}${requestTime}`,
                    error,
                );
            }

            response
                .status(500)
                .send('Server Error');
            return;
        }
    }

    private async handleEndpointCheck(
        request: express.Request,
        response: express.Response,
    ) {
        const requestID = (request as ServerRequest).requestID || randomUUID();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (000 Start) Handling POST ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (401 Unauthorized) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(401)
                    .send('Unauthorized');
                return;
            }


            if (
                !request.body.id
                || !request.body.sha
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(400)
                    .send('Bad Request');
                return;
            }


            const {
                token,
                id: objectID,
                sha,
            } = request.body as ServerRequestCheckBody;


            const verifiedToken = await this.verifyToken(token);

            if (
                !verifiedToken
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (403 Forbidden) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const objectData = await this.getObject(
                objectID,
            );

            if (
                !objectData
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(400)
                    .send('Bad Request');
                return;
            }


            const computedSha = createHash('sha256').update(objectData).digest('hex');
            const checked = sha === computedSha;

            const responseData = {
                checked,
            };


            if (
                !request.is(DEON_MEDIA_TYPE)
            ) {
                if (this.debugAllows('info')) {
                    const requestTime = this.computeRequestTime(request);

                    console.info(
                        `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                    );
                }

                response.json(responseData);
                return;
            }


            const deon = new Deon();
            const responseDeon = deon.stringify(responseData);

            response.setHeader(
                'Content-Type',
                DEON_MEDIA_TYPE,
            );

            if (this.debugAllows('info')) {
                const requestTime = this.computeRequestTime(request);

                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                const requestTime = this.computeRequestTime(request);

                console.error(
                    `[${new Date().toISOString()} :: ${requestID}] (500 Server Error) Could not handle POST ${request.path}${requestTime}`,
                    error,
                );
            }

            response
                .status(500)
                .send('Server Error');
            return;
        }
    }

    private async handleEndpointRemove(
        request: express.Request,
        response: express.Response,
    ) {
        const requestID = (request as ServerRequest).requestID || randomUUID();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (000 Start) Handling POST ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (401 Unauthorized) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(401)
                    .send('Unauthorized');
                return;
            }


            if (
                !request.body.id
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(400)
                    .send('Bad Request');
                return;
            }


            const {
                token,
                id: objectID,
            } = request.body as ServerRequestRemoveBody;


            const verifiedToken = await this.verifyToken(token);

            if (
                !verifiedToken
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${new Date().toISOString()} :: ${requestID}] (403 Forbidden) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const removed = await this.removeObject(
                objectID,
            );


            const responseData = {
                removed,
            };


            if (
                !request.is(DEON_MEDIA_TYPE)
            ) {
                if (this.debugAllows('info')) {
                    const requestTime = this.computeRequestTime(request);

                    console.info(
                        `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                    );
                }

                response.json(responseData);
                return;
            }


            const deon = new Deon();
            const responseDeon = deon.stringify(responseData);

            response.setHeader(
                'Content-Type',
                DEON_MEDIA_TYPE,
            );

            if (this.debugAllows('info')) {
                const requestTime = this.computeRequestTime(request);

                console.info(
                    `[${new Date().toISOString()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                const requestTime = this.computeRequestTime(request);

                console.error(
                    `[${new Date().toISOString()} :: ${requestID}] (500 Server Error) Could not handle POST ${request.path}${requestTime}`,
                    error,
                );
            }

            response
                .status(500)
                .send('Server Error');
            return;
        }
    }

    private handleOptions(
        partialOptions?: OpjectServerPartialOptions,
    ) {
        const options: OpjectServerOptions = {
            serverName: partialOptions?.serverName || DEFAULT_SERVER_OPTIONS.SERVER_NAME,
            quiet: partialOptions?.quiet || DEFAULT_SERVER_OPTIONS.QUIET,
            debug: partialOptions?.debug
                ? partialOptions?.debug
                : environment.production ? 'error' : 'info',
        };
        return options;
    }

    private configureServer() {
        this.serverApplication.disable('x-powered-by');

        this.serverApplication.use(
            (request, _, next) => {
                const requestID = randomUUID();
                (request as ServerRequest).requestID = requestID;

                const requestTime = Date.now();
                (request as ServerRequest).requestTime = requestTime;

                next();
            }
        );

        this.serverApplication.use(
            express.json(),
        );

        this.serverApplication.use(
            express.raw({
                type: DEON_MEDIA_TYPE,
            }),
        );

        this.serverApplication.use(
            async (request, _, next) => {
                try {
                    if (!request.is(DEON_MEDIA_TYPE) || !Buffer.isBuffer(request.body)) {
                        next();
                        return;
                    }

                    const body = request.body.toString();
                    const deon = new Deon();
                    const data = await deon.parse(body);
                    request.body = data;

                    next();
                } catch (error) {
                    const requestID = (request as ServerRequest).requestID || '';
                    const requestIDLog = requestID
                        ? ` :: ${requestID}`
                        : '';

                    if (this.debugAllows('error')) {
                        console.error(
                            `[${new Date().toISOString()}${requestIDLog}] Could not handle deon middleware ${request.path}`,
                            error,
                        );
                    }

                    // An unparsable body is treated as empty and rejected by the endpoint validation.
                    request.body = {};
                    next();
                }
            },
        );

        this.serverApplication.use(
            async (request, _, next) => {
                try {
                    // Express 5 leaves the body undefined when no parser matched the request.
                    if (
                        !request.body
                        || typeof request.body !== 'object'
                        || Buffer.isBuffer(request.body)
                    ) {
                        request.body = {};
                    }

                    const authorization = request.header('Authorization');

                    if (!authorization) {
                        next();
                        return;
                    }

                    const token = authorization.replace('Bearer ', '');

                    if (!token) {
                        next();
                        return;
                    }

                    if (!request.body.token) {
                        request.body.token = token;
                    }

                    next();
                } catch (error) {
                    const requestID = (request as ServerRequest).requestID || '';
                    const requestIDLog = requestID
                        ? ` :: ${requestID}`
                        : '';

                    if (this.debugAllows('error')) {
                        console.error(
                            `[${new Date().toISOString()}${requestIDLog}] Could not handle token middleware ${request.path}`,
                            error,
                        );
                    }

                    next();
                }
            }
        )
    }

    private debugAllows(
        level: DebugLevels,
    ) {
        if (this.options.quiet) {
            return false;
        }

        if (this.options.debug === 'none') {
            return false;
        }

        switch (level) {
            case 'error':
                return true;
            case 'warn':
                if (
                    this.options.debug === 'error'
                ) {
                    return false;
                }
                return true;
            case 'info':
                if (
                    this.options.debug === 'error'
                    || this.options.debug === 'warn'
                ) {
                    return false;
                }

                return true;
            default:
                return false;
        }
    }

    private computeRequestTime(
        request: express.Request,
    ) {
        const requestTime = (request as ServerRequest).requestTime;

        if (!requestTime) {
            return '';
        }

        const now = Date.now();
        const difference = now - requestTime;

        return ` in ${difference} ms`;
    }


    private async getObject(
        id: string,
    ) {
        if (this.customGetObject) {
            return await this.customGetObject(
                id,
            );
        }

        const objectPath = resolveStoragePath(OBJECTS_PATH, id);
        if (!objectPath) {
            return;
        }

        try {
            return await fs.readFile(objectPath, 'utf-8');
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return;
            }
            throw error;
        }
    }

    private async getMetadata(
        id: string,
    ): Promise<OpjectMetadata | undefined> {
        if (this.customGetMetadata) {
            return await this.customGetMetadata(
                id,
            );
        }

        const metadataPath = resolveStoragePath(METADATA_PATH, id);
        if (!metadataPath) {
            return;
        }

        try {
            const deonData = await fs.readFile(
                metadataPath,
                'utf-8',
            );
            const deon = new Deon();
            const data = await deon.parse(deonData);

            return data;
        } catch (error) {
            return;
        }
    }

    private async registerObject(
        id: string,
        data: string,
    ) {
        if (this.customRegisterObject) {
            return await this.customRegisterObject(
                id,
                data,
            );
        }

        const objectPath = resolveStoragePath(OBJECTS_PATH, id);
        if (!objectPath) {
            return false;
        }

        await fs.mkdir(path.dirname(objectPath), { recursive: true });
        await fs.writeFile(
            objectPath,
            data,
        );

        return true;
    }

    private async registerMetadata(
        id: string,
        dependencies: string[] | undefined,
    ) {
        const data = {
            dependencies: dependencies ?? [],
        };

        if (this.customRegisterMetadata) {
            return await this.customRegisterMetadata(
                id,
                data,
            );
        }

        const metadataPath = resolveStoragePath(METADATA_PATH, id);
        if (!metadataPath) {
            return false;
        }

        const deon = new Deon();
        const deonData = deon.stringify(data);

        await fs.mkdir(path.dirname(metadataPath), { recursive: true });
        await fs.writeFile(
            metadataPath,
            deonData,
        );

        return true;
    }

    private async removeObject(
        id: string,
    ) {
        if (this.customRemoveObject) {
            return await this.customRemoveObject(
                id,
            );
        }

        const objectPath = resolveStoragePath(OBJECTS_PATH, id);
        const metadataPath = resolveStoragePath(METADATA_PATH, id);
        if (!objectPath || !metadataPath) {
            return false;
        }

        try {
            await fs.unlink(objectPath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return false;
            }
            throw error;
        }

        await fs.rm(metadataPath, { force: true });

        return true;
    }
}
// #endregion module



// #region exports
export default OpjectServer;
// #endregion exports
