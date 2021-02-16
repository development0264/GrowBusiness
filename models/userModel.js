const mongoose = require('mongoose');
const BoostModel = require('./boostModel');
const schema = mongoose.Schema;
const ObjectID = schema.Types.ObjectID;

const userSchema = new schema({
    email: { type: String },
    profile_photo: { type: String },
    full_name: { type: String },
    password: { type: String },
    location: { type: String },
    account_type: { type: String },
    register_type: { type: String },
    social_id: { type: String },
    investment_startRange: { type: Number },
    investment_endRange: { type: Number },
    investment_return: { type: String },
    roi: { type: Number },
    equity: { type: Number },
    contact_number: { type: String },
    experience: { type: Number },
    revenue: { type: Number },
    industry_type: { type: String },
    about: { type: String },
    tags: { type: Array },
    media: { type: Array },
    is_premium_user: { type: Boolean, default: false },
    plan_id: { type: ObjectID, ref: 'PlanModel' },
    receipt_data: { type: String },
    amount: { type: Number },
    premium_plan_purchased_on: { type: Date },
    purchase_verification: { type: Boolean, default: false },
    is_documents_verified: { type: Number, default: 2 }, // 0 - pending, 1 - verified, 2 - rejected   
    is_business_verified: { type: Object, default: null },
    is_address_verified: { type: Object, default: null },
    /*
    is_business_verified: {
        files: { type: Object },
        status: { type: Number, default: 0 }, 0 - pending, 1 - verified, 2 - rejected   
        date: { type: Date },
        admin_comment: {type: String}
    },
    is_address_verified: {
        files: { type: Object },
        status: { type: Number, default: 0 },
        date: { type: Date },
        admin_comment: {type: String}
    },
    */
    is_logged_in: { type: Boolean, default: false },
    last_logged_out_on: { type: Date },
    isLinkAlive: { type: Boolean, default: true },
    is_user_authenticated: { type: Boolean, default: false },
    is_boost_used: { type: Boolean, default: false },
    is_on_boost: { type: Boolean, default: false },
    boost_start_time: { type: Date },
    is_boost_purchased: { type: Boolean, default: false },
    boost_id: { type: ObjectID, ref: 'BoostModel' },
    total_remaining_boost: { type: Number, default: 0 },
    total_boost_used: { type: Number, default: 0 },
    swipe_used: { type: Number, default: 0 },
    is_profile_updated: { type: Boolean, default: false },
    profile_createdAt: { type: Date },
    is_email_subscribed: { type: Boolean, default: true }
}, {
    timestamps: true
})

const UserModel = mongoose.model('UserModel', userSchema);
module.exports = UserModel;