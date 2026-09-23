import type Client from './index.mjs';
import type * as Types from './index.mjs';

declare const OpjectClient: typeof Client;
type OpjectClient = Client;

declare namespace OpjectClient {
    type OpjectClientCaching = Types.OpjectClientCaching;
    type OpjectClientOptions = Types.OpjectClientOptions;
    type OpjectClientRequiredOptions = Types.OpjectClientRequiredOptions;
    type OpjectRequireOptions = Types.OpjectRequireOptions;
    type CachedObject = Types.CachedObject;
}

export = OpjectClient;
