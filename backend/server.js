const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "Frontend endpoint here",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

let users = [];

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join', (username) => {
        const existingUser = users.find(user => user.id === socket.id);
        if (!existingUser) {
            const user = { id: socket.id, username };
            users.push(user);
            io.emit('user-joined', users); // Broadcast the updated user list to all clients
            console.log('Users after join:', users); // Debugging log
        }
    });

    socket.on('chat-message', (messageData) => {
        io.emit('chat-message', messageData); // Broadcast the message to all clients
    });

    socket.on('mute-unmute', ({ username, isMuted }) => {
        users = users.map(user =>
            user.username === username ? { ...user, isMuted } : user
        );
        io.emit('user-muted', { username, isMuted });
        console.log('User mute status changed:', username, isMuted);
    });

    socket.on('disconnect', (reason) => {
        users = users.filter(user => user.id !== socket.id);
        io.emit('user-left', users); // Broadcast the updated user list to all clients
        console.log('User disconnected:', socket.id, 'Reason:', reason); // Debugging log
        console.log('Users after disconnect:', users); // Debugging log
    });
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});