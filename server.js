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

    // On each incoming 'draw' socket event: enqueue the event data
    socket.on('draw', (data) => {
        /**
         * Decoupling Receiving from Broadcasting
         * By enqueuing the event instead of immediately broadcasting it within this listener, 
         * we decouple the incoming network interface from the outbound broadcasting logic.
         * This separation of concerns allows the server to absorb sudden bursts of network 
         * traffic without blocking the Node.js event thread and gives us the chance to 
         * throttle or process events at a controlled rate before sending them out.
         */
        queue.enqueue({ socket, data });
    });

    // On incoming 'undo' socket event: broadcast immediately to all other clients
    socket.on('undo', (data) => {
        // Broadcasts directly bypassing the queue
        socket.broadcast.emit('undo', data);
    });

    socket.on('disconnect', () => {
        console.log(Client disconnected: );
    });
});

/**
 * Worker Loop Setup
 * 
 * Why 16ms? (approx 60fps)
 * 1000ms / 60 frames â‰ˆ 16.6ms. By processing the sync queue at roughly ~60hz,
 * we match the standard refresh rate of most user displays. This provides visually
 * smooth and real-time updates for users watching others draw, without indiscriminately
 * spamming network packets.
 * 
 * Simulating an Event Processor
 * The setInterval acts as our background event processing loop. Moving broadcast 
 * dispatches into a fixed-interval worker ensures predictable, controlled execution 
 * CPU time. Instead of executing immediately when a message arrives, we process 
 * tasks from the queue continuously. This guarantees steady processing pacing,
 * mitigating "event storms" where many users drawing at once could stall the server.
 */
setInterval(() => {
    if (!queue.isEmpty()) {
        const item = queue.dequeue();
        
        // Ensure the item has a socket context to broadcast from
        if (item && item.socket) {
            // Dequeue one event and broadcast it via socket to all other clients
            item.socket.broadcast.emit('draw', item.data);
        }
    }
}, 16);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(Server listening on port );
});