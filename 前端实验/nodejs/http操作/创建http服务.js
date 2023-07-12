//导入http模块
const http = require('http')
//创建服务对象
const server = http.createServer((request,response)=>{
    response.end('hello http server') //设置响应体
}) //回调函数执行时间：收到http请求的时候
//监听端口，启动服务
server.listen(9000, ()=>{
    console.log('服务启动时执行')
}) //9000是端口号，可自定义