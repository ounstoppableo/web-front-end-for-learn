const fs = require('fs')
fs.writeFile('./zuoyouming.txt', '三人行，则必有我师焉', err => {
    //写入失败：err是一个错误对象
    //写入成功：err是null
    if (err) {
        console.log('写入失败')
        return
    }
    console.log('写入成功')
})