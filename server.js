const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const EventQueue = require('./eventQueue.js');

const app = express();
const server = http.createServer(app);

// Express + Socket.io setup with CORS enabled for http://localhost:3000
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Create a single global queue instance
const queue = new EventQueue();

// GET /status REST endpoint returning queue size
app.get('/status', (req, res) => {
    res.json({ queueSize: queue.size() });
});

io.on('connection', (socket) => {
    console.log(Client connected: );

    socket.on('disconnect', () => {
        console.log(Client disconnected: );
    });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(Server listening on port );
});