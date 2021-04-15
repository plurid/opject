// #region imports
    // #region libraries
    import vm from 'vm';
    // #endregion libraries


    // #region imports
    import {
        OpjectClientOptions,
        OpjectClientRequiredOptions,

        OpjectRequestOptions,
    } from '~data/interfaces';

    import {
        computeSourceSha,
    } from '~utilities/sha';

    import fetcher, {
        Fetch,
    } from '~utilities/fetcher';
    // #endregion imports
// #endregion imports



// #region methods
class Client {
    private options: OpjectClientRequiredOptions;
    private requireURL: string;
    private registerURL: string;
    private checkURL: string;

    private fetch: Fetch;


    constructor(
        options: OpjectClientOptions,
    ) {
        this.options = this.handleOptions(options);
        this.requireURL = this.options.url + this.options.requireRoute;
        this.registerURL = this.options.url + this.options.registerRoute;
        this.checkURL = this.options.url + this.options.checkRoute;

        this.fetch = fetcher(this.options.token);
    }


    public async request(
        objectID: string,
        options?: OpjectRequestOptions,
    ) {
        const {
            skipCheck,
            useVM,
            vmContext,
            vmInstantiation,
            serealState,
        } = options || {};

        const requireData = await this.fetch(
            this.requireURL,
            {
                id: objectID,
            },
        );

        const {
            object,
        } = requireData;

        if (!skipCheck) {
            const sourceSha = computeSourceSha(object);
            const checkData = await this.fetch(
                this.checkURL,
                {
                    id: objectID,
                    sha: sourceSha,
                },
            );

            if (!checkData.checked) {
                return;
            }
        }

        if (useVM) {
            const vmSource = vmInstantiation
                ? object + vmInstantiation
                : object;

            const vmContextObject = vm.createContext(vmContext || {});

            const compute = vm.runInContext(
                vmSource,
                vmContextObject,
            );

            return compute;
        }

        const Opject = eval('(' + object + ')');
        const opject = new Opject();

        if (serealState) {
            opject.loadSereal(serealState);
        }

        return opject;
    }

    public async register(
        objectID: string,
        objectData: string,
    ) {
        const data = await this.fetch(
            this.registerURL,
            {
                object: objectID,
                data: objectData,
            },
        );

        return data.registered;
    }


    private handleOptions (
        options: OpjectClientOptions,
    ): OpjectClientRequiredOptions {
        const {
            url,
            token,
            requireRoute,
            registerRoute,
            checkRoute,
        } = options;

        return {
            url,
            token,
            requireRoute: requireRoute || '/require',
            registerRoute: registerRoute || '/register',
            checkRoute: checkRoute || '/check',
        };
    }
}
// #endregion methods



// #region exports
export default Client;
// #endregion exports
