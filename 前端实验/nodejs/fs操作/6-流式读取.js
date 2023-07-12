const fs = require('fs')
//创建读取流对象
const rs = fs.createReadStream('./1.mp4')
//绑定data事件
rs.on('data', chunk => { //chunk有块的意思
    console.log(chunk.length) //65536字节 => 64KB
})
//绑定end事件
rs.on('end', ()=>{
    console.log('读取完成')
})