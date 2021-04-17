// #region imports
    // #region libraries
    import path from 'path';
    // #endregion libraries
// #endregion imports



// #region module
export const DEFAULT_SERVER_PORT = process.env.PORT
    ? parseInt(process.env.PORT)
    : 8080;


export const DEFAULT_SERVER_OPTIONS_SERVER_NAME = 'Opject Server';
export const DEFAULT_SERVER_OPTIONS_QUIET = false;

export const DEFAULT_SERVER_OPTIONS = {
    SERVER_NAME: DEFAULT_SERVER_OPTIONS_SERVER_NAME,
    QUIET: DEFAULT_SERVER_OPTIONS_QUIET,
};


export const ENDPOINT_REQUIRE = process.env.OPJECT_SERVER_ENDPOINT_REQUIRE || '/require';
export const ENDPOINT_REGISTER = process.env.OPJECT_SERVER_ENDPOINT_REGISTER || '/register';
export const ENDPOINT_CHECK = process.env.OPJECT_SERVER_ENDPOINT_CHECK || '/check';
export const ENDPOINT_REMOVE = process.env.OPJECT_SERVER_ENDPOINT_REMOVE || '/remove';



export const environment = {
    production: process.env.ENV_MODE === 'production',
    development: process.env.ENV_MODE === 'development',
};



export const BASE_PATH = process.env.OPJECT_SERVER_BASE_PATH || path.join(process.cwd(), '/data');
export const OBJECTS_PATH = process.env.OPJECT_SERVER_OBJECTS_PATH || path.join(BASE_PATH, '/objects');
export const METADATA_PATH = process.env.OPJECT_SERVER_METADATA_PATH || path.join(BASE_PATH, '/metadata');
// #endregion module
