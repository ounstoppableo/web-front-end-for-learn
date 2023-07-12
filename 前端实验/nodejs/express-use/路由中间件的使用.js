const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
//声明路由中间件函数
let checkCodeMiddleware = (req,res,next)=>{
    //判断url中查询字符串的code参数是否等于521
    if(req.query.code === '521'){
       //执行请求回调
       next()
    }else {
       res.send('暗号错误')
    }
}
app.get('/home',(req,res) => {
    res.send('前台首页')
})
app.get('/admin',checkCodeMiddleware,(req,res) => {
	res.send('后台首页')
})
app.get('/setting',checkCodeMiddleware,(req,res) => {
    res.send('后台设置')
})
app.get('*',(req,res) => {
    res.send('<h1>404 Not Found</h1>')
})
app.listen(9000,()=>{
    console.log('服务开启成功')
})