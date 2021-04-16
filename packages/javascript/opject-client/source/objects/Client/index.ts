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

    import Cacher from '~objects/Cacher';

    import {
        resolveCaching,
    } from '~utilities/caching';

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
    private removeURL: string;

    private fetch: Fetch;
    private cache: Cacher;


    constructor(
        options: OpjectClientOptions,
    ) {
        this.options = this.handleOptions(options);
        this.requireURL = this.options.url + this.options.requireRoute;
        this.registerURL = this.options.url + this.options.registerRoute;
        this.checkURL = this.options.url + this.options.checkRoute;
        this.removeURL = this.options.url + this.options.removeRoute;

        this.fetch = fetcher(this.options.token);
        this.cache = new Cacher();
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
            useCache,
        } = options || {};

        const skipCheckValue = skipCheck ?? false;

        const cachedData = useCache
            ? this.cache.get(objectID)
            : undefined;

        const requireData = cachedData
            ? cachedData
            : await this.fetch(
                this.requireURL,
                {
                    id: objectID,
                },
            );

        const {
            object,
        } = requireData;

        if (!skipCheckValue) {
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
                id: objectID,
                data: objectData,
            },
        );

        const {
            registered,
        } = data;

        if (registered) {
            this.cache.set(
                objectID,
                objectData,
                this.options.caching,
            );
        }

        return registered;
    }

    public async remove(
        objectID: string,
    ) {
        const data = await this.fetch(
            this.removeURL,
            {
                id: objectID,
            },
        );

        const {
            removed,
        } = data;

        if (removed) {
            this.cache.unset(
                objectID,
            );
        }

        return removed;
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
            removeRoute,
            caching,
        } = options;

        return {
            url,
            token,
            requireRoute: requireRoute || '/require',
            registerRoute: registerRoute || '/register',
            checkRoute: checkRoute || '/check',
            removeRoute: removeRoute || '/remove',
            caching: resolveCaching(caching),
        };
    }
}
// #endregion methods



// #region exports
export default Client;
// #endregion exports
