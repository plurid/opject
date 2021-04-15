// #region imports
    // #region imports
    import {
        OpjectClientOptions,
        OpjectClientRequiredOptions,
    } from '~data/interfaces';
    // #endregion imports
// #endregion imports



// #region methods
class Client {
    private options: OpjectClientRequiredOptions;


    constructor(
        options: OpjectClientOptions,
    ) {
        this.options = options;
    }


    public async request(
        objectID: string,
        serealState?: any,
    ) {
        // call server for the object ID

        // receive object source code

        // check object source code

        // instantiate object

        // load sereal state

        // return object instance
    }
}
// #endregion methods



// #region exports
export default Client;
// #endregion exports
