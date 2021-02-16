const mongoose = require('mongoose');
const schema = mongoose.Schema;
const ObjectID = schema.Types.ObjectID;

const historyPurchaseSchema = new schema({
    user_id: { type: ObjectID, ref: 'UserModel' },
    device_type: { type: "string"},
    product_id: { type: "string"},
    amount: { type: "string"},
    receipt_data : { type: "string"},
}, {
    timestamps: true
})

const historyPurchaseModel = mongoose.model('historyPurchase', historyPurchaseSchema);
module.exports = historyPurchaseModel;