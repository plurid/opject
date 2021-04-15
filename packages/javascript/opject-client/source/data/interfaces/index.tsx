// #region module
export interface OpjectClientOptions {
    url: string;
    requireRoute?: string;
    registerRoute?: string;
}

export type OpjectClientRequiredOptions = Required<OpjectClientOptions>;
// #endregion module
