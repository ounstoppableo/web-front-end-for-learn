const mongoose = require('mongoose')
const AccountSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    type: {
        type: Number,
        enum: [-1,1]
    },
    account: {
        type: Number,
        required: true
    },
    remarks: {
        type: String,
        default: '无'
    },
    username: {
        type: String,
        required: true
    }
})
const accountModel = mongoose.model('accounts',AccountSchema)
module.exports = accountModel