// #region imports
    // #region libraries
    import vm from 'node:vm';
    import path from 'node:path';
    import { createHash } from 'node:crypto';
    import { createRequire } from 'node:module';

    import spawn from 'cross-spawn';
    // #endregion libraries


    // #region imports
    import {
        USE_YARN,
    } from '../../data/constants';

    import {
        OpjectClientOptions,
        OpjectClientRequiredOptions,

        OpjectRequireOptions,
    } from '../../data/interfaces';

    import Cacher from '../Cacher';

    import {
        resolveCaching,
    } from '../../utilities/caching';

    import fetcher, {
        Fetch,
    } from '../../utilities/fetcher';
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


    public async require(
        objectID: string,
        options?: OpjectRequireOptions,
    ): Promise<any> {
        const {
            skipCheck,
            useVM,
            vmContext,
            vmInstantiation,
            serealState,
            useCache,
            useYarn,
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
            dependencies,
        } = requireData;


        if (!skipCheckValue) {
            const sourceSha = createHash('sha256').update(object).digest('hex');
            const checkData = await this.fetch(
                this.checkURL,
                {
                    id: objectID,
                    sha: sourceSha,
                },
            );

            if (!checkData.checked) {
                if (cachedData) {
                    // The cached copy is stale: drop it and verify a fresh copy instead.
                    this.cache.unset(objectID);
                    return this.require(objectID, options);
                }

                return;
            }
        }

        if (useCache && !cachedData) {
            this.cache.set(
                objectID,
                object,
                this.options.caching,
                dependencies,
            );
        }


        const installedDependencies = await this.installDependencies(
            dependencies,
            useYarn,
        );

        if (!installedDependencies) {
            console.log('Could not install dependencies.');
            return;
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


        // Resolve dependencies from the consumer in both ESM and CommonJS builds.
        const require = createRequire(path.join(process.cwd(), 'package.json'));
        const Opject = new Function('require', 'return (' + object + ')')(require);
        const opject = new Opject();

        if (serealState) {
            if (typeof opject.loadSereal !== 'function') {
                console.log(`Opject '${objectID}' is not a serealable object.`);
                return;
            }

            opject.loadSereal(serealState);
        }

        return opject;
    }

    public async register(
        objectID: string,
        objectData: string,
        objectDependencies?: string[],
        trim: boolean = true,
    ) {
        if (trim) {
            objectData = objectData.trim() + '\n';
        }

        const data = await this.fetch(
            this.registerURL,
            {
                id: objectID,
                data: objectData,
                dependencies: objectDependencies,
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
                objectDependencies,
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


    private handleOptions(
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

    private async installDependencies(
        dependencies: string[] | undefined,
        useYarn: boolean = USE_YARN,
    ) {
        if (!dependencies?.length) {
            return true;
        }

        try {
            const result = spawn.sync(
                useYarn ? 'yarn' : 'npm',
                [useYarn ? 'add' : 'install', '--', ...dependencies],
                {
                    cwd: process.cwd(),
                },
            );

            if (result.error || result.status !== 0) {
                return;
            }

            return true;
        } catch (error) {
            return;
        }
    }
}
// #endregion methods



// #region exports
export default Client;
// #endregion exports
