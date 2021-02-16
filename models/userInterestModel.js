const mongoose = require('mongoose');
const schema = mongoose.Schema;
const ObjectID = schema.Types.ObjectID;

const userInerestSchema = new schema({
    user_id: { type: String },
    interestedUser_id: { type: String },
    intersted_status: { type: Number, default: 0 }, // 0 - not reacted, 1 - like, 2 - dislike, 3 - matched
    is_chat_initiated: { type: Boolean, default: false }
}, {
    timestamps: true
})

const UserInterestModel = mongoose.model('UserInterestModel', userInerestSchema);
module.exports = UserInterestModel;