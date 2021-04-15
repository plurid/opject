const Server = require('../distribution');


const server = new Server({
    verifyToken: async () => true,
});


server.start(7766);
