const express = require('express')
const accountModel = require('../db/schema/accountModel')
const userModel = require('../db/schema/userModel')
const moment = require('moment')
const isHaveSession = require('../middleware/isHaveSession')
const router = express.Router()

/* GET home page. */
//添加主页面渲染模块
router.get('/account', isHaveSession, function (req, res, next) {
  accountModel.find({username: req.session.username}).sort({ time: -1 }).then(data => {
    res.render('list', { accounts: data, moment })
  }).catch(e => {
    console.log(e)
  })
});
//添加表单填写模块
router.get('/account/create', isHaveSession, function (req, res, next) {
  res.render('create')
})
//添加表单提交模块,提交的同时在数据库创建文档
router.post('/account', isHaveSession, function (req, res, next) {
  accountModel.create({
    ...req.body,
    time: moment(req.body.time).toString(),
    username: req.session.username
  }).then(() => {
    res.render('success', { msg: '添加成功', url: '/account' })
  }).catch(e => {
    console.log(e)
  })
})
//添加主页面删除项模块，同时操作数据库文档
router.get('/account/:id', isHaveSession, function (req, res, next) {
  //因为能查找出的id都是经过渲染模块筛选出来的，所以不会有删除别的账户的记录的情况
  accountModel.deleteOne({ _id: req.params.id }).then(() => {
    res.render('success', { msg: '删除成功', url: '/account' })
  })
})

//添加注册模块
router.get('/reg', function (req, res, next) {
  res.render('auth/reg')
})
router.post('/reg', function (req, res, next) {
  userModel.create(req.body).then(() => {
    res.render('success', { msg: '注册成功', url: '/login' })
  }).catch(e => {
    if (e.code === 11000) res.render('error', { msg: '用户名已存在', url: '/reg' })
    console.log(e)
  })
})

//添加登录模块
router.get('/login', function (req, res, next) {
  res.render('auth/login')
})
router.post('/login', function (req, res, next) {
  userModel.findOne({ username: req.body.username }).then(data => {
    if (data.password !== req.body.password) throw ('用户名或密码错误')
    req.session.username = req.body.username
    res.render('success', { msg: '登录成功', url: '/account' })
  }).catch(e => {
    res.render('error', { msg: e, url: '/login' })
  })
})

//退出登录模块
router.get('/logout', (req, res, next) => {
  req.session.destroy(() => {
    res.render('success', { msg:'退出登录成功', url: '/account' })
  })
})

module.exports = router