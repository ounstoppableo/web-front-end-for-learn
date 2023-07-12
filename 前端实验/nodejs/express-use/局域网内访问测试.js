const express = require('express')
const app = express()
const hostname = '10.199.177.22'
const port = 9000
//静态网页导入
app.use(express.static(__dirname + '/../../html/pyg'))
app.listen(port,hostname,()=>{
    console.log('服务开启成功')
})