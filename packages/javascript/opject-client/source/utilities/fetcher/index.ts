// #region imports
    // #region libraries
    import fetchLibrary from 'cross-fetch';
    // #endregion libraries
// #endregion imports



// #region module
export type Fetch = <B = any, R = any>(
    url: string,
    body: B,
) => Promise<R>;

const fetcher = (
    token: string,
): Fetch => async <B>(
    url: string,
    body: B,
) => {
    const response = await fetchLibrary(
        url,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                ...body,
            }),
        },
    );

    return await response.json();
}
// #endregion module



// #region exports
export default fetcher;
// #endregion exports
