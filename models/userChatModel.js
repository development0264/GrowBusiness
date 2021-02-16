const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userChatSchema = new schema({
    room_id: { type: String },
    socket_id: { type: String },
    sender_id: { type: String },
    receiver_id: { type: String },
    is_receiver_currently_active: { type: Boolean, default: false },
    receiver_last_active: { type: Date },
    is_chat_deleted: { type: Boolean, default: false },
    is_chat_archived: { type: Boolean, default: false },
    is_receiver_block: { type: Boolean, default: false },
    is_socket_on: { type: Boolean, default: false }
}, {
    timestamps: true
})

const UserChatModel = mongoose.model('UserChatModel', userChatSchema);
module.exports = UserChatModel;