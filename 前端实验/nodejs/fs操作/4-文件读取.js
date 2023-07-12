const fs = require('fs')
//异步读取
fs.readFile('./guanshuyougan.txt',(err,data)=>{
    if(err){
        console.log('读取失败')
    	return
    }
    console.log(data.toString())
})