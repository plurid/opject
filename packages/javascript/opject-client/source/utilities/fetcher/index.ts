// #region module
export type Fetch = <B = any, R = any>(
    url: string,
    body: B,
) => Promise<R>;

const fetcher = (
    token: string,
): Fetch => async <B, R>(
    url: string,
    body: B,
) => {
    const response = await fetch(
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

    if (!response.ok) {
        throw new Error(`Opject request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json() as R;
}
// #endregion module



// #region exports
export default fetcher;
// #endregion exports
