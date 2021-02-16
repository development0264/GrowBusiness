const mongoose = require('mongoose');
const schema = mongoose.Schema;

const subscriptionSchema = new schema({
    user_id: { type: String, default: null },
    is_subscription_on: { type: Boolean, default: false },
    previous_subscribed_plan: { type: String, default: null },
    previous_plan_start_dateTime: { type: Date, default: null },
    subscription_start_dateTime: { type: Date, default: null },
    current_subscribed_plan: { type: String, default: null },
    next_subscribing_plan: { type: String, default: null },
    next_plan_start_dateTime: { type: Date, default: null },
    will_cancel: { type: Boolean, default: false }
}, {
    timestamps: true
})

const SubscriptionModel = mongoose.model('SubscriptionModel', subscriptionSchema);
module.exports = SubscriptionModel;