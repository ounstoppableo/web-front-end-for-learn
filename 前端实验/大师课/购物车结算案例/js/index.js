// 每个商品的对象结构
class UIGood {
    constructor(g) {
        this.data = g
        this.choose = 0
    }
    increase() {
        this.choose++
    }
    decrease() {
        if (this.choose <= 0) return
        this.choose--
    }
    ischoose() {
        return this.choose > 0
    }
    getTotalPrice() {
        return this.data.price * this.choose
    }
}
// 整个页面的数据的对象结构
class UIData {
    constructor(goods) {
        this.datas = goods.map(item => new UIGood(item))
        this.deliveryThreshold = 30
        this.deliveryPrice = 5
    }
    increase(index) {
        this.datas[index].increase()
    }
    decrease(index) {
        this.datas[index].decrease()
    }
    // 求所有商品总价
    getTotalPrice() {
        return this.datas.reduce((p, n) => p + n.getTotalPrice(), 0)
    }
    // 是否超过运送门槛
    isCrossDeliveryTreshold() {
        return this.getTotalPrice() > this.deliveryThreshold
    }
    // 购物车是否为空
    isCarEmpty() {
        return this.datas.find(item => item.choose > 0) ? false : true
    }
    // 某个商品是否被选中
    isChoose(index) {
        return this.datas[index].ischoose()
    }
    // 商品选中数量
    chooseNumber() {
        return this.datas.reduce((r, n) => r + n.choose, 0)
    }
}
// 整个页面的对象结构
class UI {
    constructor(goods) {
        this.uiData = new UIData(goods)
        this.deliveryPrice = this.uiData.deliveryPrice
        this.deliveryThreshold = this.uiData.deliveryThreshold
        this.doms = {
            // 商品列表
            goodsList: document.querySelector('.goods-list'),
            // 购物车
            footerCar: document.querySelector('.footer-car'),
            // 购物车右上角计数红标
            badge: document.querySelector('.footer-car-badge'),
            // 底部运送门槛模块
            footerPay: document.querySelector('.footer-pay'),
            // 底部配送费模块
            footerCarTip: document.querySelector('.footer-car-tip'),
            // 底部总价模块
            footerCarTotal: document.querySelector('.footer-car-total'),
        }
        // 两个函数表示对整个页面的渲染，即商品列表和底部模块
        this.updateGoodList()
        this.updateFooter()
        // 打开事件监听
        this.eventListener()
        // 计算抛物线的终点位置
        const footerCarPosition = this.doms.footerCar.getBoundingClientRect()
        this.target = {
            x: footerCarPosition.x + footerCarPosition.width / 2,
            y: footerCarPosition.y + footerCarPosition.height / 5
        }
    }
    // 接口提前
    getTotalPrice() {
        return this.uiData.getTotalPrice()
    }
    isChoose(index) {
        return this.uiData.isChoose(index)
    }
    isCarEmpty() {
        return this.uiData.isCarEmpty()
    }
    chooseNumber() {
        return this.uiData.chooseNumber()
    }
    // 所有事件监听函数
    eventListener() {
        this.doms.footerCar.addEventListener('animationend', function () {
            this.classList.remove('animate')
        })
        // 使用事件委托
        const self = this
        this.doms.goodsList.addEventListener('touchend', e => {
            if (e.target.nodeName === 'I') {
                const { classList } = e.target
                if (Array.from(classList).find(item => item === 'i-jianhao')) {
                    self.decrease(+e.target.parentNode.dataset.id)
                }
                if (Array.from(classList).find(item => item === 'i-jiajianzujianjiahao')) {
                    self.increase(+e.target.parentNode.dataset.id)
                }
            }
        })
    }
    // 更新货物表
    updateGoodList() {
        this.doms.goodsList.innerHTML = this.uiData.datas.map((item,index) => {
            return `
            <div class="goods-item">
            <img src="${item.data.pic}" alt="" class="goods-pic" />
            <div class="goods-info">
              <h2 class="goods-title">${item.data.title}</h2>
              <p class="goods-desc">
                ${item.data.desc}
              </p>
              <p class="goods-sell">
                <span>月售 ${item.data.sellNumber}</span>
                <span>好评率${item.data.favorRate}%</span>
              </p>
              <div class="goods-confirm">
                <p class="goods-price">
                  <span class="goods-price-unit">￥</span>
                  <span>${item.data.price}</span>
                </p>
                <div class="goods-btns" data-id=${index}>
                  <i class="iconfont i-jianhao"></i>
                  <span>${item.choose}</span>
                  <i class="iconfont i-jiajianzujianjiahao"></i>
                </div>
              </div>
            </div>
          </div>
            `
        }).join('')
    }
    // 添加货物函数,添加货物的同时进行按钮渲染,更新底部模块,底部购物车动画,加号抛物线动画
    increase(index) {
        this.uiData.increase(index)
        this.updateGoodsItem(index)
        this.updateFooter()
        this.footerAnime()
        this.parabola(index)
    }
    // 减少货物函数,添加货物的同时进行按钮渲染、更新底部模块
    decrease(index) {
        this.uiData.decrease(index)
        this.updateGoodsItem(index)
        this.updateFooter()
    }
    // 增加减少货物时,更新按钮样式的模块
    updateGoodsItem(index) {
        const good = document.querySelectorAll('.goods-item')[index]
        if (this.isChoose(index)) {
            good.classList.add('active')
        } else {
            good.classList.remove('active')
        }
        good.querySelector('.goods-btns').innerHTML = `
        <i class="iconfont i-jianhao"></i>
        <span>${this.uiData.datas[index].choose}</span>
        <i class="iconfont i-jiajianzujianjiahao"></i>
        `
    }
    // 更新底部模块
    updateFooter() {
        if (this.isCarEmpty()) {
            this.doms.footerCar.classList.remove('active')
        } else {
            this.doms.footerCar.classList.add('active')
        }
        // 总价
        const total = this.getTotalPrice().toFixed(2)
        // 距运送门槛还差的价钱
        let left = (this.deliveryThreshold - total).toFixed(2)
        // 选择的商品数量
        const num = this.chooseNumber()
        this.doms.badge.innerHTML = num
        this.doms.footerCarTotal.innerHTML = total
        this.doms.footerCarTip.innerHTML = `配送费￥${this.deliveryPrice}`
        if (left > 0) {
            if (this.doms.footerPay.classList.remove('active'));
            this.doms.footerPay.querySelector('span').innerHTML = `差￥${left}元起送`
        } else {
            this.doms.footerPay.classList.add('active')
        }
    }
    // 底部购物车动画
    footerAnime() {
        this.doms.footerCar.classList.add('animate')
    }
    // 加号抛物线动画
    parabola(index) {
        const jiahao = document.querySelectorAll('.i-jiajianzujianjiahao')[index]
        const jiahaoPosition = jiahao.getBoundingClientRect()
        // 计算抛物线开始位置
        const start = {
            x: jiahaoPosition.left,
            y: jiahaoPosition.top
        }
        // 添加元素
        const div = document.createElement('div')
        const i = document.createElement('i')
        div.classList.add('add-to-car')
        i.classList.add('iconfont', 'i-jiajianzujianjiahao')
        div.style.transform = `translate(${start.x}px,${start.y}px)`
        div.append(i)
        document.body.append(div)
        // 执行动画
        // 由于reflow的渲染机制,改变i的translate值并不会立即渲染页面,此时需要强制渲染,比如读属性
        i.clientHeight
        // div表示x轴匀速运动,i表示y轴自由落体运动,结合而成抛物线运动
        div.style.transform = `translateX(${this.target.x}px)`
        i.style.transform = `translateY(${this.target.y}px)`
        div.addEventListener('transitionend', function () {
            div.remove()
        })
    }
}
const ui = new UI(goods)