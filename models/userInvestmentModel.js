const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userInvestmentSchema = new schema({
    investor_user_id: { type: String },
    business_user_id: { type: String },
    investment_amount: { type: String },
    investment_return: { type: String },
    roi: { type: String },
    equity: { type: String },
    revenue: { type: String },
    is_investment_approved: { type: Boolean, default: false },
    approved_dateTime: { type: Date },
    is_investment_accepted: { type: Number }, // 0 - pending, 1 - accepted, 2 - declined
    accepted_dateTime: { type: Date }
}, {
    timestamps: true
})

const UserInvestmentModel = mongoose.model('UserInvestmentModel', userInvestmentSchema);
module.exports = UserInvestmentModel;