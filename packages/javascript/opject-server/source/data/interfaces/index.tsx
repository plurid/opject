// #region imports
    // #region libraries
    import express from 'express';
    // #endregion libraries
// #endregion imports



// #region module
export type ServerRequest = express.Request & {
    requestID: string;
    requestTime: number;
}

export type ServerRequestObjectBody = {
    token: string;
    id: string;
}

export type ServerRequestRegisterBody = {
    token: string;
    object: string;
    data: string;
}

export type ServerRequestCheckBody = {
    token: string;
    id: string;
    sha: string;
}


export type DebugLevels =
    | 'none'
    | 'error'
    | 'warn'
    | 'info';


export interface OpjectServerOptions {
    /** To be used for logging. Default `Plurid Server` */
    serverName: string;

    /**
     * To log or not to log to the console.
     */
    quiet: boolean;

    /**
     * Debug levels.
     *
     * Production default: `error`.
     * Development default: `info` and above.
     */
    debug: DebugLevels;
}


export type OpjectServerPartialOptions = Partial<OpjectServerOptions>;



export type VerifyToken = (
    token: string,
) => Promise<boolean>;

export type GetObject = (
    id: string,
) => Promise<string | undefined>;

export type RegisterObject = (
    id: string,
    data: string,
) => Promise<boolean>;

export interface OpjectServerConfiguration {
    verifyToken: VerifyToken;
    getObject?: GetObject;
    registerObject?: RegisterObject;
    options?: OpjectServerPartialOptions;
}
// #endregion module
