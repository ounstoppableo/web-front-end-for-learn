const fs = require('fs')
//调用rename方法
fs.rename('./zuoyouming.txt','./座右铭.txt', err =>{
    if(err){
        console.log(err)
        return
    }
    console.log('重命名成功')
})