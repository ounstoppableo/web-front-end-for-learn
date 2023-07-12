const fs = require('fs')
//调用appenFile方法
fs.appendFile('./zuoyouming.txt','则其善者而从之，其不善者而改之', err => {
   if(err){
        console.log('写入失败')
        return
    }
    console.log('写入成功')
})