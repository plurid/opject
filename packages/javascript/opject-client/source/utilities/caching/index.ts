// #region imports
    // #region imports
    import {
        OpjectClientCaching,
    } from '~data/interfaces';

    import {
        SECONDS_ONE_DAY,
    } from '~data/constants';
    // #endregion imports
// #endregion imports



// #region methods
const resolveCaching = (
    value?: OpjectClientCaching,
) => {
    if (!value) {
        return SECONDS_ONE_DAY;
    }

    if (value === 'none') {
        return 0;
    }

    if (value === 'default') {
        return SECONDS_ONE_DAY;
    }

    return value;
}
// #endregion methods



// #region exports
export {
    resolveCaching,
};
// #endregion exports
