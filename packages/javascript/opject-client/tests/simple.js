const OpjectClient = require('../distribution');


const opjectClient = new OpjectClient({
    url: 'http://localhost:7766',
    token: '__TESTS__',
});

const opjectID = 'some-opject';

const opjectSource = `
class SomeOpject {
    internal = 12;

    read() {
        return this.internal;
    }
}
`;


const main = async () => {
    const registered = await opjectClient.register(
        opjectID,
        opjectSource,
    );

    if (!registered) {
        console.log('Opject not registered');
        return;
    }

    const someOpject = await opjectClient.request(
        opjectID,
    );

    const value = someOpject.read() // 12
    console.log(value);
}

main();
