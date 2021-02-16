const mongoose = require('mongoose');
const schema = mongoose.Schema;

const testSchema = new schema({

    profile_photo: { type: String },
    business_photo: { type: String },
    media: { type: Array },
}, {
    timestamps: true
})

const TestModel = mongoose.model('TestModel', testSchema);
module.exports = TestModel;