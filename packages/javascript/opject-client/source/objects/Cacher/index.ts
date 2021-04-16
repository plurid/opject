// #region imports
    // #region libraries
    import {
        time,
    } from '@plurid/plurid-functions';
    // #endregion libraries


    // #region external
    import {
        CachedObject,
    } from '~data/interfaces';
    // #endregion external
// #endregion imports



// #region module
class Cacher {
    private objects: Map<string, CachedObject> = new Map();

    public get(
        objectID: string,
    ) {
        const cached = this.objects.get(objectID);

        if (!cached) {
            return;
        }

        if (time.now() > cached.expiration) {
            this.unset(objectID);
            return;
        }

        return cached.data;
    }

    public set(
        objectID: string,
        objectData: string,
        cacheTime: number,
    ) {
        this.objects.set(
            objectID,
            {
                data: {
                    object: objectData,
                },
                expiration: time.now() + cacheTime,
            },
        );
    }

    public unset(
        objectID: string,
    ) {
        this.objects.delete(objectID);
    }

    public reset() {
        this.objects = new Map();
    }
}
// #endregion module



// #region exports
export default Cacher;
// #endregion exports
