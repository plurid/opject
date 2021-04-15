// #region imports
    // #region imports
    import fetch from 'cross-fetch';
    // #endregion imports


    // #region imports
    import {
        OpjectClientOptions,
        OpjectClientRequiredOptions,
    } from '~data/interfaces';
    // #endregion imports
// #endregion imports



// #region methods
class Client {
    private options: OpjectClientRequiredOptions;
    private requireURL: string;
    private registerURL: string;


    constructor(
        options: OpjectClientOptions,
    ) {
        this.options = this.handleOptions(options);
        this.requireURL = this.options.url + this.options.requireRoute;
        this.registerURL = this.options.url + this.options.registerRoute;
    }


    public async request(
        objectID: string,
        serealState?: any,
    ) {
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

        // check object source code

        // HACK to use the vm instead of eval (?)
        // https://stackoverflow.com/a/39299283/6639124
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
        } = options;

        return {
            url,
            token,
            requireRoute: requireRoute || '/require',
            registerRoute: registerRoute || '/register',
        };
    }
}
// #endregion methods



// #region exports
export default Client;
// #endregion exports
