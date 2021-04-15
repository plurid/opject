// #region imports
    // #region external
    import Client from '../';
    // #endregion external
// #endregion imports



// #region methods
describe('Client', () => {
    it('works', async () => {
        const client = new Client({
            url: 'localhost:7766',
        });

        const objectID = 'some-object';

        const registered = await client.register(
            objectID,
            `
                class SomeObject {
                    internal = 12;

                    read() {
                        return this.internal;
                    }
                }
            `,
        );
        expect(registered).toBeTruthy();

        const someObject = await client.request(objectID);

        expect(someObject.read()).toEqual(12);
    });
});
// #endregion methods
