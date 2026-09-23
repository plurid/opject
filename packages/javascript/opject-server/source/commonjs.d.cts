import type Server from './index.mjs';
import type * as Types from './index.mjs';

declare const OpjectServer: typeof Server;
type OpjectServer = Server;

declare namespace OpjectServer {
    type ServerRequest = Types.ServerRequest;
    type ServerRequestObjectBody = Types.ServerRequestObjectBody;
    type ServerRequestRegisterBody = Types.ServerRequestRegisterBody;
    type ServerRequestCheckBody = Types.ServerRequestCheckBody;
    type ServerRequestRemoveBody = Types.ServerRequestRemoveBody;
    type DebugLevels = Types.DebugLevels;
    type OpjectServerOptions = Types.OpjectServerOptions;
    type OpjectServerPartialOptions = Types.OpjectServerPartialOptions;
    type OpjectServerConfiguration = Types.OpjectServerConfiguration;
    type OpjectMetadata = Types.OpjectMetadata;
    type VerifyToken = Types.VerifyToken;
    type GetObject = Types.GetObject;
    type GetMetadata = Types.GetMetadata;
    type RegisterObject = Types.RegisterObject;
    type RegisterMetadata = Types.RegisterMetadata;
    type RemoveObject = Types.RemoveObject;
}

export = OpjectServer;
