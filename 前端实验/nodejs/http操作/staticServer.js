const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = {
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    json: 'application/json'
}
const port = 9000
const hostname = '127.0.0.1'
const server = http.createServer((req, res) => {
    console.log(req.url);
    const { pathname } = new URL(req.url, 'http://127.0.0.1')
    const root = path.resolve(__dirname, 'page')
    const filePath = pathname === '/' ? root + pathname + 'index.html' : root + pathname
    fs.readFile(filePath, (err, data) => {
        // 设置不同错误返回的响应报文
        if (err) {
            switch(err.code){
                case 'ENOENT':
                    res.statusCode = 404
                    res.end('404 Not Found')
                    break
                case 'EPERM':
                    res.statusCode = 403
                    res.end('403 Forbidden')
                    break
            }
            return
        }
        //判断扩展名设置MIME值
        const ext = path.extname(filePath).slice(1)
        if (mime[ext]) {
            // 只需要设置index页面的charset，那么由index页面引出的链接都会以该charset解析
            if (ext === 'html') {
                res.setHeader('content-type', mime[ext] + ';charset=utf-8')
            } else {
                res.setHeader('content-type', mime[ext])
            }
        } else {
            res.setHeader('content-type', 'application/octet-stream;charset=utf-8')
        }
        // 设置响应体
        res.end(data)
    })
})
server.listen(port, hostname, () => {
    console.log('服务开启成功');
})