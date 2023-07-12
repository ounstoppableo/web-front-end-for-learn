const ejs = require('ejs')
//以前拼接字符串与变量的方法，这种方法使得html与js变量耦合，不易拆解
let china = '中国'
// let str = `我爱你 ${china}`
//使用ejs.render()进行字符串拼接
// let result = ejs.render('我爱你 <%= china %>', { china: china })
let str = `我爱你 <%= china%>`
let result = ejs.render(str, { china: china })
console.log(result);