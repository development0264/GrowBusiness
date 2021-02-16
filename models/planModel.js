const mongoose = require('mongoose');
const schema = mongoose.Schema;

const planSchema = new schema({
    plan_name: { type: String },
    description: { type: String },
    plan_amount: { type: Number },
    is_swipe_unlimited: { type: Boolean },
    swipe_limit: { type: Number },
    match_limit: { type: Number },
    montly_free_boost_limit: { type: Number },
    is_ad_free: { type: Boolean },
    allow_likes_you: { type: Boolean },
    allow_rewind: { type: Boolean }
}, {
    timestamps: true
})

const PlanModel = mongoose.model('PlanModel', planSchema);
module.exports = PlanModel;