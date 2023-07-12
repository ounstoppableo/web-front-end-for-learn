module.exports = (req, res, next)=>{
    //浏览器或者服务端一方没有session则走if线
    if(!req.session.username) return res.render('auth/login')
    next()
}