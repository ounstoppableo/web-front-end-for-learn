const fs = require('fs')
const rs = fs.createReadStream('./1.mp4')
const ws = fs.createWriteStream('./1(2).mp4')
rs.on('data', chunk => {
    ws.write(chunk)
})