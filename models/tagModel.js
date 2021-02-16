const mongoose = require('mongoose');
const schema = mongoose.Schema;

const tagSchema = new schema({
    tag: { type: String },
}, {
    timestamps: true
})

const TagModel = mongoose.model('TagModel', tagSchema);
module.exports = TagModel;