// #region imports
    // #region external
    import Client from '../';
    // #endregion external
// #endregion imports



// #region methods
describe('Client', () => {
    const client = new Client({
        url: 'http://localhost:7766',
        token: '__TESTS__',
    });

    const objectID = 'some-object';

    const objectSource = `
    class SomeObject {
        internal = 12;

        read() {
            return this.internal;
        }
    }
    `;


    xit('simple test', async () => {
        const registered = await client.register(
            objectID,
            objectSource,
        );
        expect(registered).toBeTruthy();

        const someObject = await client.require(
            objectID,
        );

        expect(someObject.read()).toEqual(12);
    });


    xit('opject with dependencies', async () => {
        const registered = await client.register(
            objectID,
            objectSource,
            [
                '@plurid/plurid-functions@0.0.0-1',
            ],
        );
        expect(registered).toBeTruthy();

        const someObject = await client.require(
            objectID,
            {
                useYarn: true,
            },
        );

        expect(someObject.read()).toEqual(12);
    });


    xit('vm test', async () => {
        const registered = await client.register(
            objectID,
            objectSource,
        );
        expect(registered).toBeTruthy();

        const someObject = await client.require(
            objectID,
            {
                useVM: true,
                vmInstantiation: `
                    const someObject = new SomeObject();

                    someObject.read();
                `,
            },
        );

        expect(someObject).toEqual(12);
    });
});
// #endregion methods
