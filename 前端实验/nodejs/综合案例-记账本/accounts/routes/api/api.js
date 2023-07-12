const express = require('express')
const isHaveToken = require('../../middleware/isHaveToken')
const userModel = require('../../db/schema/userModel')
const jwt = require('jsonwebtoken')
const accountModel = require('../../db/schema/accountModel')
const router = express.Router()
//首先定义登录模块
router.post('/login', (req, res, next) => {
    userModel.findOne({ username: req.body.username }).then(data => {
        if (req.body.password !== data.password) {
            return res.json({
                code: 1002,
                msg: '密码错误',
                data: null
            })
        }
        res.json({
            code: 1000,
            msg: '登录成功',
            data: {
                token: jwt.sign({
                    data: data.username
                }, 'hello world', {
                    expiresIn: 60 * 60 * 24 * 7, //单位是秒
                }),
            }
        })
    })
})
//定义获取数据模块
router.get('/getdata', isHaveToken, (req, res, next) => {
    jwt.verify(req.query.token, 'hello world', (err, data) => {
        if (err) {
            return res.json({
                code: 1004,
                msg: 'token有误',
                data: null
            })
        }
        accountModel.find({ username: data.data }).then(data => {
            res.json({
                code: 1000,
                msg: '获取数据成功',
                data
            })
        })
    })
})
//定义删除一条数据模块
router.post('/deldataone', isHaveToken, (req, res, next) => {
    jwt.verify(req.body.token, 'hello world', (err, data) => {
        if (err) {
            return res.json({
                code: 1004,
                msg: 'token有误',
                data: null
            })
        }
        accountModel.findOne({ _id: req.body.id }).then(result => {
            let data = null
            data = result
            accountModel.deleteOne({ _id: req.body.id }).then(() => {
                res.json({
                    code: 1000,
                    msg: '删除成功',
                    data
                })
            })
        })
    })
})
//定义增加一条数据
router.post('/adddataone', isHaveToken, (req, res, next) => {
    jwt.verify(req.body.token, 'hello world', (err, data) => {
        if (err) {
            return res.json({
                code: 1004,
                msg: 'token有误',
                data: null
            })
        }
        accountModel.create({
            ...req.body,
            username: data.data
        }).then(result => {
            res.json({
                code: 1000,
                msg: '添加成功',
                username: data.data,
                data: result
            })
        })
    })
})
module.exports = router