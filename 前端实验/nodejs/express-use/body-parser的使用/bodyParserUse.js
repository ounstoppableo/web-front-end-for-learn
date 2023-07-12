/*
*GET /login进入一个页面，有用户名，密码两个文本框
*POST /login获取表单信息
*/
const express = require('express')
const bodyParser = require('body-parser')
//解析json数据的中间件
const jsonParser = bodyParser.json()
//解析query字符串的中间件
const urlencodedParser = bodyParser.urlencoded()
const app = express()
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html')
})
app.post('/login',urlencodedParser,(req,res)=>{
    //获取用户名和密码,当中间件运行完后，会将值传递到req.body中
    console.log(req.body)
})
app.listen(9000, () => {
    console.log('服务开启成功')
})