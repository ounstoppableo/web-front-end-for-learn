class Promise {
    // 初始化
    constructor(evator) {
        const self = this
        this.PromiseState = 'pending'
        this.PromiseResult = null
        this.callback = []
        // 创建resolve函数
        function resolve(value) {
            // 判断PromiseState是否初始化过,满足只能初始化一次的条件
            if (self.PromiseState === 'pending') {
                self.PromiseState = 'fulfilled'
                self.PromiseResult = value
                // 状态确定后执行callback函数
                if (self.callback) {
                    // 模拟微任务
                    setTimeout(() => {
                        self.callback.forEach(item => {
                            item.onresolve()
                        })
                    }, 0)
                }
            }
        }
        // 创建reject函数
        function reject(reason) {
            // 判断PromiseState是否初始化过
            if (self.PromiseState === 'pending') {
                self.PromiseState = 'rejected'
                self.PromiseResult = reason
                // 状态确定后执行callback函数
                if (self.callback) {
                    setTimeout(() => {
                        self.callback.forEach(item => {
                            item.onreject()
                        })
                    }, 0)
                }
            }
        }
        // evator同步执行,抓取错误设为rejected
        try {
            evator(resolve, reject)
        } catch (e) {
            reject(e)
        }

    }
    // 实例化方法
    then(onresolve, onreject) {
        const self = this
        return new Promise((resolve, reject) => {
            // onreject未传参数的情况
            if (typeof onreject !== 'function') {
                onreject = function () {
                    reject(self.PromiseResult)
                }
            }
            // onresolve未传参数的情况
            if (typeof onresolve !== 'function') {
                onresolve = function () {
                    resolve(self.PromiseResult)
                }
            }
            // 封装then返回值函数
            function thenPromise(type) {
                try {
                    const result = type(self.PromiseResult)
                    if (result instanceof Promise) {
                        result.then(v => {
                            resolve(v)
                        }, r => {
                            reject(r)
                        })
                    } else {
                        resolve(result)
                    }
                } catch (e) {
                    reject(e)
                }
            }
            // then有三种情况：
            // 1.PromiseState为fulfilled的情况

            if (this.PromiseState === 'fulfilled') {
                // 有两种情况:
                // onresolve返回的结果为promise\非promise
                //then方法处理回调也是异步,即微任务,使用计时器模拟
                setTimeout(() => { thenPromise(onresolve) }, 0)

            }
            // 2.PromiseState为rejected的情况
            if (this.PromiseState === 'rejected') {
                setTimeout(() => { thenPromise(onreject) }, 0)
            }
            // 3.PromiseState为pending的情况
            if (this.PromiseState === 'pending') {
                // 将回调存储到Promise中，直至状态确定才再次执行
                // 类似事件监听
                // 使用.push满足多次回调
                this.callback.push({
                    onresolve: function () {
                        thenPromise(onresolve)
                    },
                    onreject: function () {
                        thenPromise(onreject)
                    }
                })
            }
        })
    }
    catch(onreject) {
        return this.then(undefined, onreject)
    }
    // 静态方法
    static resolve(data) {
        return new Promise((resolve, reject) => {
            if (data instanceof Promise) {
                data.then(v => {
                    resolve(v)
                }, r => {
                    reject(r)
                })
            } else {
                resolve(data)
            }
        })
    }
    static reject(data) {
        return new Promise((resolve, reject) => {
            reject(data)
        })
    }
    static all(Promises) {
        return new Promise((resolve, reject) => {
            const arr = []
            for (let i = 0; i < Promises.length; i++) {
                Promises[i].then(v => {
                    arr[i] = v
                    if (arr.length === Promises.length) {
                        resolve(arr)
                    }
                }, r => {
                    reject(r)
                })
            }
        })
    }
    static race(Promises) {
        return new Promise((resolve, reject) => {
            Promises.forEach(item => {
                item.then(v => {
                    resolve(v)
                }, r => {
                    reject(r)
                })
            })
        })
    }
}




