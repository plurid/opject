// #region imports
    // #region libraries
    import crypto from 'crypto';
    // #endregion libraries
// #endregion imports



// #region module
const computeSourceSha = (
    data: string,
) => {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
}
// #endregion module



// #region exports
export {
    computeSourceSha,
};
// #endregion exports
