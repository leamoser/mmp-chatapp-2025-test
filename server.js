import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import pg from 'pg';

// -> express
const app = express();
const server = createServer(app);
app.use(express.static('public'));

// -> socket.io
const io = new Server(server, {
    connectionStateRecovery: {}
});

// -> postgres
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/chat_db';
const pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});
pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      msg TEXT,
      username TEXT
  );
`).catch(err => console.error('🛑 Error creating table', err));

// -> socket.io events
io.on('connection', async (socket) => {
    console.log('🟢 a user connected');
    if (!socket.recovered) {
        try {
            const result = await pool.query('SELECT id, msg, username FROM messages WHERE id > $1', [socket.handshake.auth.serverOffset || 0]);
            result.rows.forEach((row) => {
                socket.emit('broadcast_chat', row.msg, row.username, row.id);
            });
        } catch (e) {
            console.error('🧑🏽‍💻 error on reading old messages from database', e);
        }
    }
    socket.on('send_chat', async (msg, username) => {
        try {
            const text = 'INSERT INTO messages (msg, username) VALUES ($1, $2) RETURNING id';
            const values = [msg, username];
            const res = await pool.query(text, values);
            io.emit('broadcast_chat', msg, username, res.rows[0].id);
        } catch (e) {
            console.error('🧑🏽‍💻 error on inserting message into database', e);
        }
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
