// #region imports
    // #region libraries
    import path from 'path';

    import {
        promises as fs,
    } from 'fs';

    import {
        Server,
    } from 'http';

    import express, {
        Express,
    } from 'express';

    import {
        raw as bodyParserRaw,
        json as bodyParserJSON,
    } from 'body-parser';

    import Deon, {
        DEON_MEDIA_TYPE,
    } from '@plurid/deon';

    import {
        time,
        uuid,
    } from '@plurid/plurid-functions';
    // #endregion libraries


    // #region external
    import {
        environment,

        DEFAULT_SERVER_PORT,
        DEFAULT_SERVER_OPTIONS,

        ENDPOINT_REQUIRE,
        ENDPOINT_REGISTER,
    } from '../../data/constants';

    import {
        ServerRequest,
        ServerRequestObjectBody,
        ServerRequestRegisterBody,

        DebugLevels,

        OpjectServerOptions,
        OpjectServerPartialOptions,
        OpjectServerConfiguration,

        VerifyToken,
        GetObject,
        RegisterObject,
    } from '../../data/interfaces';
    // #endregion external
// #endregion imports



// #region module
class OpjectServer {
    private options: OpjectServerOptions;
    private serverApplication: Express;
    private server: Server | undefined;
    private port: number | string;

    private verifyToken: VerifyToken;
    private customGetObject: GetObject | undefined;
    private customRegisterObject: RegisterObject | undefined;


    constructor(
        configuration: OpjectServerConfiguration,
    ) {
        this.options = this.handleOptions(configuration?.options);

        this.serverApplication = express();
        this.port = DEFAULT_SERVER_PORT;

        this.verifyToken = configuration.verifyToken;
        this.customGetObject = configuration.getObject;
        this.customRegisterObject = configuration.registerObject;

        this.configureServer();

        this.handleEndpoints();

        process.addListener('SIGINT', () => {
            this.stop();
            process.exit(0);
        });
    }


    public start(
        port = this.port,
    ) {
        this.port = port;

        const serverlink = `http://localhost:${port}`;

        if (this.debugAllows('info')) {
            console.info(
                `\n\t[${time.stamp()}] ${this.options.serverName} Started on Port ${port}: ${serverlink}\n`,
            );
        }

        this.server = this.serverApplication.listen(port);

        return this.server;
    }

    public stop() {
        if (this.server) {
            if (this.debugAllows('info')) {
                console.info(
                    `\n\t[${time.stamp()}] ${this.options.serverName} Stopped on Port ${this.port}\n`,
                );
            }

            this.server.close();
        } else {
            if (this.debugAllows('info')) {
                console.info(
                    `\n\t[${time.stamp()}] ${this.options.serverName} Could not be Stopped on Port ${this.port}\n`,
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
    }

    private async handleEndpointRequire(
        request: express.Request,
        response: express.Response,
    ) {
        const requestID = (request as ServerRequest).requestID || uuid.generate();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${time.stamp()} :: ${requestID}] (000 Start) Handling POST ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (401 Unauthorized) Could not handle POST ${request.path}${requestTime}`,
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
                        `[${time.stamp()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
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
                        `[${time.stamp()} :: ${requestID}] (403 Forbidden) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const objectData = await this.getObject(objectID);

            if (
                !objectData
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (404 Not Found) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(404)
                    .send('Not Found');
                return;
            }



            const contentType = request.header('Content-Type');

            const responseData = {
                object: objectData,
            };


            if (
                contentType !== DEON_MEDIA_TYPE
            ) {
                if (this.debugAllows('info')) {
                    const requestTime = this.computeRequestTime(request);

                    console.info(
                        `[${time.stamp()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
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
                    `[${time.stamp()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                const requestTime = this.computeRequestTime(request);

                console.error(
                    `[${time.stamp()} :: ${requestID}] (500 Server Error) Could not handle POST ${request.path}${requestTime}`,
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
        const requestID = (request as ServerRequest).requestID || uuid.generate();

        try {
            if (this.debugAllows('info')) {
                console.info(
                    `[${time.stamp()} :: ${requestID}] (000 Start) Handling POST ${request.path}`,
                );
            }


            if (
                !request.body.token
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (401 Unauthorized) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(401)
                    .send('Unauthorized');
                return;
            }


            if (
                !request.body.object
                || !request.body.data
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(400)
                    .send('Bad Request');
                return;
            }


            const {
                token,
                object,
                data,
            } = request.body as ServerRequestRegisterBody;


            const verifiedToken = await this.verifyToken(token);

            if (
                !verifiedToken
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (403 Forbidden) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(403)
                    .send('Forbidden');
                return;
            }


            const registered = await this.registerObject(
                object,
                data,
            );

            if (
                !registered
            ) {
                if (this.debugAllows('warn')) {
                    const requestTime = this.computeRequestTime(request);

                    console.warn(
                        `[${time.stamp()} :: ${requestID}] (400 Bad Request) Could not handle POST ${request.path}${requestTime}`,
                    );
                }

                response
                    .status(400)
                    .send('Bad Request');
                return;
            }


            const contentType = request.header('Content-Type');

            const responseData = {
                registered,
            };


            if (
                contentType !== DEON_MEDIA_TYPE
            ) {
                if (this.debugAllows('info')) {
                    const requestTime = this.computeRequestTime(request);

                    console.info(
                        `[${time.stamp()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
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
                    `[${time.stamp()} :: ${requestID}] (200 OK) Handled POST ${request.path}${requestTime}`,
                );
            }

            response.send(responseDeon);

            return;
        } catch (error) {
            if (this.debugAllows('error')) {
                const requestTime = this.computeRequestTime(request);

                console.error(
                    `[${time.stamp()} :: ${requestID}] (500 Server Error) Could not handle POST ${request.path}${requestTime}`,
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
                const requestID = uuid.generate();
                (request as ServerRequest).requestID = requestID;

                const requestTime = Date.now();
                (request as ServerRequest).requestTime = requestTime;

                next();
            }
        );

        this.serverApplication.use(
            bodyParserJSON(),
        );

        this.serverApplication.use(
            bodyParserRaw({
                type: DEON_MEDIA_TYPE,
            }),
        );

        this.serverApplication.use(
            async (request, _, next) => {
                try {
                    const contentType = request.header('Content-Type');

                    if (contentType !== DEON_MEDIA_TYPE) {
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
                            `[${time.stamp()}${requestIDLog}] Could not handle deon middleware ${request.path}`,
                            error,
                        );
                    }

                    next();
                }
            },
        );

        this.serverApplication.use(
            async (request, _, next) => {
                try {
                    const contentType = request.header('Content-Type');

                    if (
                        contentType !== DEON_MEDIA_TYPE
                        && contentType !== 'application/json'
                    ) {
                        next();
                        return;
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
                            `[${time.stamp()}${requestIDLog}] Could not handle token middleware ${request.path}`,
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

        return await fs.readFile(
            path.join(
                process.cwd(),
                `/objects/${id}`,
            ),
            'utf-8',
        );
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

        await fs.writeFile(
            path.join(
                process.cwd(),
                `/objects/${id}`,
            ),
            data,
        );

        return true;
    }
}
// #endregion module



// #region exports
export default OpjectServer;
// #endregion exports
