const Server = require('@plurid/opject-server');


const server = new Server({
    verifyToken: async () => true,
});


server.start(7766);
