const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const config = require('./commonfunctions/config');

const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer);

const userRouter = require('./routes/userRoute');
const investorRouter = require('./routes/investorRoute');
const businessRouter = require('./routes/businessRoute');
const adminRouter = require('./routes/adminRoute');
const userConversationRouter = require('./routes/userConversationRoute');
const deepLinkCheckRouter = require('./routes/deepLinkChekerRoute');

require('dotenv').config();

const url = process.env.MONGO_URL;
mongoose.connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('mongo connection successfully');
})

const {
    addUser,
    removeUser,
    updateMessageDeliveryStatus,
    getUserTyping
} = require('./controller/userConversationController');

app.use(cors())
app.use(express.json());
app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }));
app.use(bodyParser.text({ type: 'text/html' }));
app.use(bodyParser.text({ type: 'text/plain' }));

app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/investor', investorRouter);
app.use('/api/business', businessRouter);
app.use('/api/userConversation', userConversationRouter);
app.use('/api/deepLinkCheck', deepLinkCheckRouter);

httpServer.listen(3000, () => {
    console.log('Socket running on port 3000');
});

app.listen(config.port, () => {
    console.log('Server running on port', config.port)
})

io.on('connection', async function (socket) {
    connectionCount++;
    console.log('total user connected to socket: ', connectionCount);
    console.log('user connected to socket: ', socket.id);
    socket.on('echo', async function (data) {
        await io.emit('message', data);
    });
    // creating and joining room for user for particular event.
    socket.on('join_user_in_room', async function (room_id) {
        console.log('join_user_in_room ----> ', room_id);
        const user = await addUser({ id: socket.id, room_id });
        await socket.join(user.room_id);
        await socket.emit('room_connected', user);
    });

    socket.on('on_typing', async ({ room_id, user_id, typing }) => {
        const room = await getUserTyping(room_id);
        if (typing == true) {
            await io.to(room).emit('message', { typing, user_id });
        }
        else {
            await io.to(room).emit('message', { typing, user_id });
        }
    });

    socket.on('on_message_sent_emit', async ({ room_id, user_id }) => {
        console.log('on_message_sent ----> ', room_id, ' --->---', user_id);

        const updatedDetail = await updateMessageDeliveryStatus(room_id, user_id, 1);
        // console.log('updatedDetail.room ------> ', updatedDetail.room);
        // console.log('updatedDetail.updated ------> ', updatedDetail.updated);
        await io.to(updatedDetail.room).emit('on_message_sent', updatedDetail.updated);
    })

    socket.on('read_chat', async ({ room_id, user_id }) => {
        console.log('read chat ----> ', room_id);
        const updatedDetail = await updateMessageDeliveryStatus(room_id, user_id, 2);
        // console.log('io updatedDetail 1---> ', updatedDetail);
        await io.to(updatedDetail.room).emit('read_message', updatedDetail.updated);
        // await socket.emit('read_message', 'OK');
    });

    socket.on('remove_user_from_room', async function (data) {
        console.log('remove_user_from_room ----> ', data);
        const user = await removeUser(socket.id);
        await socket.leave(data);
        await socket.emit('room_disconnected', user);
    });

    socket.on("disconnect", (reason) => {
        connectionCount--;
        console.log('total user connected to socket: ', connectionCount);
        console.log('disconnect ----> ', reason);
        socket.disconnect();
    });
});

app.io = io;

module.exports = app;