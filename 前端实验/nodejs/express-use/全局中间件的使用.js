const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
//声明全局中间件函数
function recordMiddleware(req,res,next){
    const {url,ip} = req
    //将url与ip保存在access.log文件
    fs.appendFileSync(path.resolve(__dirname,'./access.log'),`${url} ${ip}\r\n`)
    //调用next,表示执行完全局中间件后继续执行后续请求的回调
    next()
}
//使用中间件函数
app.use(recordMiddleware)

app.get('/home',(req,res) => {
    res.send('前台首页')
})
app.get('/admin',(req,res) => {
    res.send('后台首页')
})
app.get('*',(req,res) => {
    res.send('<h1>404 Not Found</h1>')
})
app.listen(9000,()=>{
    console.log('服务开启成功')
})