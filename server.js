import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';

// -> express
const app = express();
const server = createServer(app);
app.use(express.static('public'));

// -> socket.io
const io = new Server(server, {
    connectionStateRecovery: {}
});

// -> beter sqlite
const db = new Database('chat.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      msg TEXT,
      username TEXT
  );
`);

// -> socket.io events
io.on('connection', (socket) => {
    console.log('🟢 a user connected');
    if (!socket.recovered) {
        try {
            const stmt = db.prepare('SELECT id, msg, username FROM messages WHERE id > ?');
            const rows = stmt.all(socket.handshake.auth.serverOffset || 0);
            rows.forEach((row) => {
                socket.emit('broadcast_chat', row.msg, row.username, row.id);
            });
        } catch (e) {
            console.error('🧑🏽‍💻 error on reading old messages from database', e);
        }
    }
    socket.on('send_chat', (msg, username) => {
        let result;
        try {
            const stmt = db.prepare('INSERT INTO messages (msg, username) VALUES (?, ?)');
            result = stmt.run(msg, username);
        } catch (e) {
            console.error('🧑🏽‍💻 error on inserting message into database', e);
            return;
        }
        io.emit('broadcast_chat', msg, username, result.lastInsertRowid);
    });
    socket.on('disconnect', () => {
        console.log('🔴 user disconnected');
    });
});

// -> routing
app.get('/', (req, res) => {
    res.sendFile(new URL('./index.html', import.meta.url).pathname);
});

// -> dev server
server.listen(3000, () => {
    console.log('💻 server running at http://localhost:3000');
});
