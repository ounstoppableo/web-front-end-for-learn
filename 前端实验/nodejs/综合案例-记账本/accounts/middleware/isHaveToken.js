module.exports = (req, res, next) => {
    if (!req.query.token && !req.body.token) {
        return res.json({
            code: 1001,
            msg: '请填写token',
            data: null
        })
    }
    next()
}