const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userConversationSchema = new schema({
    sender_id: { type: String },
    receiver_id: { type: String },
    message: { type: String },
    media: { type: Array },
    is_message_deleted: { type: Boolean, default: false },
    message_deleted_by_user1: { type: String, default: null },
    message_deleted_by_user2: { type: String, default: null },
    message_status: { type: Number }, // 0-sending, 1-sent, 2-seen
    message_status_update_dateTime: { type: Date }
}, {
    timestamps: true
})

const UserConversationModel = mongoose.model('UserConversationModel', userConversationSchema);
module.exports = UserConversationModel;