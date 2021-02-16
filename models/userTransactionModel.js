const mongoose = require('mongoose');
const schema = mongoose.Schema;
const ObjectID = schema.Types.ObjectID;

const userTransactionSchema = new schema({
    user_id: { type: ObjectID, ref: 'UserModel' },
    plan_id: { type: ObjectID, ref: 'PlanModel' },
    device_id: { type: String },
    payment_method: { type: String },
    payment_id: { type: String },
    transaction_amount: { type: String },
    transaction_charge: { type: String },
    payment_status: { type: String, default: 'Pending' },
    payment_dateTime: { type: Date },
    subsctiption_id: { type: String }
}, {
    timestamps: true
})

const UserTransactionModel = mongoose.model('UserTransactionModel', userTransactionSchema);
module.exports = UserTransactionModel;