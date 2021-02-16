const mongoose = require('mongoose');
const schema = mongoose.Schema;

const NotificationSchema = new schema({
    udid: { type: String },
    registrationToken: { type: String },
    platform: { type: String },
    user_id: { type: String }
}, {
    timestamps: true,
})

const NotificationModel = mongoose.model('NotificationModel', NotificationSchema);
module.exports = NotificationModel;