const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(Server listening on port );
});