// #region module
/**
 * Caching value in seconds `number`, `'none'`, or `'default'` (`86_400`, one day).
 */
export type OpjectClientCaching = 'none' | 'default' | number;

export interface OpjectClientOptions {
    url: string;
    token: string;
    requireRoute?: string;
    registerRoute?: string;
    checkRoute?: string;
    caching?: OpjectClientCaching;
}

export type OpjectClientRequiredOptions = Required<OpjectClientOptions> & {
    caching: number;
};


export interface OpjectRequestOptions {
    skipCheck?: boolean;
    useVM?: boolean;
    vmContext?: any;
    vmInstantiation?: string;
    serealState?: any;
    useCache?: boolean;
}

export interface CachedObject {
    data: {
        object: string;
    };
    expiration: number;
}
// #endregion module
