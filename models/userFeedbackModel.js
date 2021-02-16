const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userCFeedbackSchema = new schema({
    user_id: { type: String },
    reason: { type: String },
    sub_reason: { type: String },
    message: { type: String }
}, {
    timestamps: true
})

const UserFeedbackModel = mongoose.model('UserFeedbackModel', userCFeedbackSchema);
module.exports = UserFeedbackModel;