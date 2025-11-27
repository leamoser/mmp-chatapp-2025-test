import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

// -> express
const app = express();
const server = createServer(app);
app.use(express.static("public"));

// -> socket.io
const io = new Server(server, {
    connectionStateRecovery: {}
});

// -> socket.io events
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('send_chat', (msg, username) => {
        console.log('📩 ' + msg);
        io.emit('broadcast_chat', msg, username);
    });
});

// -> routing
app.get('/', (req, res) => {
    res.sendFile(new URL('./index.html', import.meta.url).pathname);
});

// -> dev server
server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
