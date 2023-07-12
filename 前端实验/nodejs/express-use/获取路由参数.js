const express = require('express')
const app = express()
// /:id表示通配，但是这样一来又有一个问题，怎么确定一串数字对应的商品
app.get('/:id.html',(req,res)=>{
    //解决方法
    //获取URL路由参数，params表示所有的路由参数，id与上边的占位符一致
    console.log(req.params)
    res.setHeader('content-type','text/html;charset=utf-8')
    res.end('商品详情')
})
app.listen(9000,()=>{
    console.log('服务启动成功')
})