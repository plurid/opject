// #region imports
    // #region libraries
    import vm from 'vm';

    import fetch from 'cross-fetch';
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
    // #endregion imports
// #endregion imports



// #region methods
class Client {
    private options: OpjectClientRequiredOptions;
    private requireURL: string;
    private registerURL: string;
    private checkURL: string;


    constructor(
        options: OpjectClientOptions,
    ) {
        this.options = this.handleOptions(options);
        this.requireURL = this.options.url + this.options.requireRoute;
        this.registerURL = this.options.url + this.options.registerRoute;
        this.checkURL = this.options.url + this.options.checkRoute;
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

        const response = await fetch(
            this.requireURL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.options.token}`,
                },
                body: JSON.stringify({
                    id: objectID,
                }),
            },
        );

        const data = await response.json();

        if (!skipCheck) {
            const sourceSha = computeSourceSha(data.object);
            const checkResponse = await fetch(
                this.checkURL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.options.token}`,
                    },
                    body: JSON.stringify({
                        id: objectID,
                        sha: sourceSha,
                    }),
                },
            );
            const checkData = await checkResponse.json();
            if (!checkData.checked) {
                return;
            }
        }

        if (useVM) {
            const vmSource = vmInstantiation
                ? data.object + vmInstantiation
                : data.object;

            const vmContextObject = vm.createContext(vmContext || {});

            const compute = vm.runInContext(
                vmSource,
                vmContextObject,
            );

            return compute;
        }

        const Opject = eval('(' + data.object + ')');
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
        const response = await fetch(
            this.registerURL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.options.token}`,
                },
                body: JSON.stringify({
                    object: objectID,
                    data: objectData,
                }),
            },
        );

        const data = await response.json();

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
