const fs = require('fs')
//创建写入流对象，其实就类似于建立一个通道
const ws = fs.createWriteStream('./guanshuyougan.txt')
//write
ws.write('床前明月光')
ws.write('疑是地上霜')
ws.write('举头望明月')
ws.write('低头思故乡')
//关闭通道
ws.close()