const mongoose = require('mongoose')
const config = require('./config/config')
module.exports = async function () {
    await mongoose.connect(`mongodb://${config.DBHOST}:${config.DBPORT}/${config.DBNAME}`)
}

