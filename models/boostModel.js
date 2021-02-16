const mongoose = require('mongoose');
const schema = mongoose.Schema;

const boostSchema = new schema({
    boost_amount: { type: String },
    boosts: { type: Number },
    percentage_save: { type: String }
}, {
    timestamps: true
})

const BoostModel = mongoose.model('BoostModel', boostSchema);
module.exports = BoostModel;