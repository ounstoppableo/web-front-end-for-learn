const config = require('./config/config')
const mysql = require('mysql2')
const pool = mysql.createPool(config)
module.exports = pool

