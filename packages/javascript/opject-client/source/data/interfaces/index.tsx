// #region module
export interface OpjectClientOptions {
    url: string;
    token: string;
    requireRoute?: string;
    registerRoute?: string;
}

export type OpjectClientRequiredOptions = Required<OpjectClientOptions>;


export interface OpjectRequestOptions {
    vmContext: any;
    vmInstantiation: string;
    serealState: any;
}
// #endregion module
