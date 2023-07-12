const mongoose = require('mongoose')
const UserScheme = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})
const userModel = mongoose.model('users',UserScheme)
module.exports = userModel