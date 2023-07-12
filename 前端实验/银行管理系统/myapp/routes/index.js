var express = require('express');
var router = express.Router();
const pool = require('../mysql/mysql-connect')
const moment = require('moment')

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('login');
});
//登录验证
router.post('/login', (req, res, next) => {
  if (req.body.username === 'admin' && req.body.password === 'admin') {
    res.render('index');
  } else {
    res.render('login');
  }
})
router.get('/welcome', function (req, res, next) {
  //计算用户数量
  pool.query('select count(*) from client', (err, data) => {
    if (err) return console.log(err)
    const userNum = data[0]['count(*)']
    //计算卖出金融产品的数量
    pool.query('select count(*) from buy_finan', (err, data1) => {
      if (err) return console.log(err)
      pool.query('select count(*) from buy_fund', (err, data2) => {
        if (err) return console.log(err)
        pool.query('select count(*) from buy_ins', (err, data3) => {
          if (err) return console.log(err)
          const hadSale = +data1[0]['count(*)'] + (+data2[0]['count(*)']) + (+data3[0]['count(*)'])
          //计算金融产品类型数量
          pool.query('select count(*) from finan_product', (err, data4) => {
            if (err) return console.log(err)
            pool.query(`select count(*) from fund where fund.state='1'`, (err, data5) => {
              if (err) return console.log(err)
              pool.query('select count(*) from insurance', (err, data6) => {
                if (err) return console.log(err)
                const finNum = +data4[0]['count(*)'] + (+data5[0]['count(*)']) + (+data6[0]['count(*)'])
                res.render('welcome', { time: moment().format('YYYY-MM-DD HH:mm:ss'), userNum, hadSale, finNum });
              })
            })
          })
        })
      })
    })
  })
});
router.get('/error', function (req, res, next) {
  res.render('error');
});
//登录页面
router.get('/login', function (req, res, next) {
  res.render('login');
});
//客户列表
router.get('/member-list/:id', function (req, res, next) {
  pool.query('select * from client', (err, result) => {
    if (err) return console.log(err)
    //用于拆分数据
    const newData = []
    //最多显示的数据数量
    const maxNum = 10
    //开始数据的下标
    const id = +req.params.id || 1
    const index = (id - 1) * maxNum
    for (let i = index; i < index + maxNum; i++) {
      if (!result[i]) break
      newData.push(result[i])
    }
    //用于显示页数
    const length = result.length / 10
    res.render('member-list', { data: newData, length, id })
  })
});
//客户列表搜索功能  利用axios返回信息
router.post('/member-list', function (req, res, next) {
  pool.query(`select * from client where client.client_id='${req.body.cardId}'`,(err,data)=>{
    if(err) return console.log(err)
    if(!data.length){
      return res.json({
        code: 400,
        msg: '没找到'
      })
    }
    res.json(data)
  })
})
//订单列表
router.get('/order-list/:id', function (req, res, next) {
  pool.query('select client.name,buy_fund.id,fund.fund_name,fund.class,fund.mng,buy_fund.time,buy_fund.pno,buy_fund.profit from client,buy_fund,fund where client.client_id=buy_fund.id and buy_fund.fundid=fund.fund_id', (err, result1) => {
    if (err) return console.log(err)
    pool.query('select client.name,buy_finan.id,finan_product.fp_name,finan_product.class,buy_finan.time,buy_finan.pno,buy_finan.profit from client,buy_finan,finan_product where client.client_id=buy_finan.id and buy_finan.fpid=finan_product.fp_id', (err, result2) => {
      if (err) return console.log(err)
      pool.query(`select client.name,buy_ins.id,insurance.insurance_name,insurance.class,buy_ins.time,buy_ins.pno,buy_ins.profit from client,buy_ins,insurance where client.client_id=buy_ins.id and buy_ins.insid=insurance.insurance_id`, (err, result3) => {
        if (err) return console.log(err)
        const data = [...result1, ...result2, ...result3]
        //按时间升序排序
        data.sort((a, b) => {
          return +new Date(b.time) - (+new Date(a.time))
        })
        //用于拆分数据
        const newData = []
        //最多显示的数据数量
        const maxNum = 10
        //开始数据的下标
        const id = +req.params.id || 1
        const index = (id - 1) * maxNum
        for (let i = index; i < index + maxNum; i++) {
          if (!data[i]) break
          newData.push(data[i])
        }
        //用于显示页数
        const length = data.length / 10
        res.render('order-list', { newData, length, id })
      })
    })
  })
});
//单个用户购买的理财产品的列表
router.get('/buy-list/:id', function (req, res, next) {
  const id = req.params.id
  pool.query(`select finan_product.fp_name,finan_product.class,buy_finan.time,buy_finan.pno,buy_finan.profit from buy_finan,finan_product where buy_finan.id='${id}' and buy_finan.fpid=finan_product.fp_id`, (err, result1) => {
    if (err) return console.log(err)
    pool.query(`select fund.fund_name,fund.class,buy_fund.time,buy_fund.pno,buy_fund.profit from buy_fund,fund where buy_fund.id='${id}' and buy_fund.fundid=fund.fund_id`, (err, result2) => {
      if (err) return console.log(err)
      pool.query(`select insurance.insurance_name,insurance.class,buy_ins.time,buy_ins.pno,buy_ins.profit from buy_ins,insurance where buy_ins.id='${id}' and buy_ins.insid=insurance.insurance_id`, (err, result3) => {
        if (err) return console.log(err)
        const data = [...result1, ...result2, ...result3]
        data.sort((a, b) => {
          return +new Date(b.time) - (+new Date(a.time))
        })
        //写出金融产品的类型
        let type = []
        if (data.length) {
          data.forEach(item => {
            let str = Object.keys(item)[0].split('_')[0]
            if (str === 'fp') str = 'finan'
            if (str === 'insurance') str = 'ins'
            type.push(str)
          })
        }
        res.render('buy-list', { data, id, type });
      })
    })
  })
});
//单个客户拥有的卡的列表
router.get('/card-list/:id', function (req, res, next) {
  const id = req.params.id
  pool.query(`select credit_id,consumption,credit_pwd,time,class from credit_card where credit_card.id = "${id}"`, (err, result1) => {
    if (err) return console.log(err)
    pool.query(`select deposit_card,balance,deposit_pwd,time from deposit_card where deposit_card.id = "${id}"`, (err, result2) => {
      if (err) return console.log(err)
      const cards = []
      result1.forEach(item => cards.push(item))
      result2.forEach(item => cards.push(item))
      console.log(cards)
      res.render('card-list', { cards })
    })
  })
});
//渲染购买金融产品填写表
router.get('/buy-finan', function (req, res, next) {
  res.render('buy-finan');
});
//提供给ajax请求的产品列表接口
router.get('/fp-list', function (req, res, next) {
  pool.query('select fp_name,fp_id,class,amount from finan_product', (err, result1) => {
    if (err) return console.log(err)
    pool.query(`select fund_name,fund_id,class,amount from fund where fund.state='1'`, (err, result2) => {
      if (err) return console.log(err)
      pool.query(`select insurance_name,insurance_id,class,amount from insurance`, (err, result3) => {
        if (err) return console.log(err)
        const data = []
        //调整数据的格式
        result1.map(item => {
          data.push({
            name: item.fp_name,
            id: `finan&${item.fp_id}`,
            class: item.class,
            amount: item.amount
          })
        })
        result2.map(item => {
          data.push({
            name: item.fund_name,
            id: `fund&${item.fund_id}`,
            class: item.class,
            amount: item.amount
          })
        })
        result3.map(item => {
          data.push({
            name: item.insurance_name,
            id: `ins&${item.insurance_id}`,
            class: item.class,
            amount: item.amount
          })
        })
        res.json({
          result: data
        })
      })
    })
  })
})
//提供给ajax请求的数据提交接口
router.post('/fp-list', function (req, res, next) {
  const { data } = req.body
  pool.query(`select * from deposit_card where deposit_card.deposit_card=${data.cardId} and deposit_card.deposit_pwd='${data.cardPwd}'`, (err, result1) => {
    if (err) return console.log(err)
    //如果没在储蓄卡表中找到
    if (!result1.length) {
      pool.query(`select * from credit_card where credit_card.credit_id=${data.cardId} and credit_card.credit_pwd='${data.cardPwd}'`, (err, result2) => {
        if (err) return console.log(err)
        //如果也没在信用卡表中找到
        if (!result2.length) {
          return res.json({
            code: 500,
            msg: '银行卡或密码错误'
          })
        }
        //account为金融产品的金额
        const [finan_class, account] = data.class.split('+')
        //cost为购买金融产品所花的钱
        const cost = (+account * data.num).toFixed(3)
        //cla表示金融产品类型，id表示金融产品类型中的序号
        const [cla, id] = finan_class.split('&')
        const time = moment().format('YYYY-MM-DD HH:mm:ss')
        //信用卡余额不足
        if (+result2[0].consumption < cost) {
          return res.json({
            code: 400,
            msg: '余额不足'
          })
        }
        let type = undefined
        if (cla === 'finan') type = 'fp'
        if (cla === 'fund') type = 'fund'
        if (cla === 'ins') type = 'ins_'
        //插入购买记录
        pool.query(`insert into buy_${cla} values('${result2[0].id}','${id}','${data.num}','${time}','${1}','${cost}')`, (err, insRes) => {
          if (err) return console.log(err)
          //balance为银行卡余额
          const balance = (+result2[0].consumption - cost).toFixed(3)
          //修改银行卡余额
          pool.query(`update credit_card set credit_card.consumption='${balance}' where credit_card.credit_id='${result2[0].credit_id}'`, (err, updRes) => {
            if (err) return console.log(err)
            return res.json({
              code: 200,
              msg: '插入成功'
            })
          })
        })
      })
      //在储蓄卡表中找到
    } else {
      //account为金融产品的金额
      const [finan_class, account] = data.class.split('+')
      //cost为购买金融产品所花的钱
      const cost = (+account * data.num).toFixed(3)
      //cla表示金融产品类型，id表示金融产品类型中的序号
      const [cla, id] = finan_class.split('&')
      const time = moment().format('YYYY-MM-DD HH:mm:ss')
      //信用卡余额不足
      if (+result1[0].balance < cost) {
        return res.json({
          code: 400,
          msg: '余额不足'
        })
      }
      let type = undefined
      if (cla === 'finan') type = 'fp'
      if (cla === 'fund') type = 'fund'
      if (cla === 'ins') type = 'ins_'
      //插入购买记录
      pool.query(`insert into buy_${cla} values('${result1[0].id}','${id}','${data.num}','${time}','${1}','${cost}')`, (err, insRes) => {
        if (err) return console.log(err)
        //balance为银行卡余额
        const balance = (+result1[0].balance - cost).toFixed(3)
        //修改银行卡余额
        pool.query(`update deposit_card set deposit_card.balance='${balance}' where deposit_card.deposit_card='${result1[0].deposit_card}'`, (err, updRes) => {
          if (err) return console.log(err)
          return res.json({
            code: 200,
            msg: '插入成功'
          })
        })
      })
    }
  })
})
//卖出金融产品的ajax请求
router.post('/sale', function (req, res, next) {
  const time = moment(req.body.time).format('YYYY-MM-DD HH:mm:ss')
  pool.query(`delete from buy_${req.body.type} where buy_${req.body.type}.id='${req.body.id}' and buy_${req.body.type}.time='${time}'`, (err, delRes) => {
    if (err) return console.log(err)
    //卖出后更新信用卡金额
    pool.query(`select credit_card.consumption from credit_card where credit_card.id='${req.body.id}'`, (err, selRes) => {
      if (err) return console.log(err)
      const consumption = (+req.body.profit + (+selRes[0].consumption)).toFixed(3)
      pool.query(`update credit_card set credit_card.consumption='${consumption}' where credit_card.id='${req.body.id}'`, (err, updRes) => {
        if (err) return console.log(err)
        res.json({
          code: 200,
          msg: '添加成功'
        })
      })
    })
  })
})
module.exports = router;
