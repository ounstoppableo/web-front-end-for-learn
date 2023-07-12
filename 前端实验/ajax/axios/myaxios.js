// 定义Axios构造函数
function Axios(config) {
    this.defaluts = config
    // 拦截器
    this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
    }
}


// 拦截器构造函数模块
function InterceptorManager() {
    this.handlers = []
}
InterceptorManager.prototype.use = function (fulfilled, rejected) {
    this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
    })
    return this.handlers.length - 1
}


// 为Axios添加各种方法
Axios.prototype.get = function (config) {
    if (config.method.toLowerCase() === 'get') {
        return Axios.prototype.request(config)
    }
}
Axios.prototype.post = function () {
    if (config.method.toLowerCase() === 'post') {
        return Axios.prototype.request(config)
    }
}
Axios.prototype.create = function () { }


// 创建request函数
Axios.prototype.request = function (config) {
    let promise = Promise.resolve(config)
    const chains = [dispatchRequest, undefined]
    // 模拟拦截器加入顺序模块
    this.interceptors.request.handlers.forEach(item => {
        chains.unshift(item.fulfilled, item.rejected)
    })
    // 使用push的原因:dispatchRequest之后才有response
    this.interceptors.response.handlers.forEach(item => {
        chains.push(item.fulfilled, item.rejected)
    })
    while (chains.length) {
        // 实际上request拦截器的作用就是：在中途修改config
        promise = promise.then(chains.shift(), chains.shift())
    }
    return promise
}


// 创建发送request请求的函数
function dispatchRequest(config) {
    return xhrAdapter(config).then((res) => {
        return res
    })
}


// 创建适配器函数
function xhrAdapter(config) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()
        xhr.open(config.method.toLowerCase(), config.url.toLowerCase())
        xhr.send()
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    const res = JSON.parse(xhr.responseText)
                    resolve({
                        config: config,
                        data: res,
                        status: res.status,
                    })
                }
            }
        }
        // 取消请求模块
        if (config.cancelToken) {
            config.cancelToken.promise.then(() => {
                if (!xhr) return
                xhr.abort()
                reject('cancel')
                xhr = null
            })
        }
    })
}


// 实例化Axios
function instenceAxios(config) {
    let context = new Axios(config)
    let instence = Axios.prototype.request.bind(context)
    // 为实例化添加各种方法
    Object.keys(Axios.prototype).forEach(key => {
        instence[key] = Axios.prototype[key]
    })
    // 为实例化添加各种属性
    Object.keys(context).forEach(key => {
        instence[key] = context[key]
    })
    return instence
}


let axios = instenceAxios({ method: 'get' })
axios.Axios = Axios

// 取消请求函数
function Canceltoken(executor) {
    let outPromiseControl
    this.promise = new Promise((resolve, reject) => {
        outPromiseControl = resolve
    })
    executor(function () {
        outPromiseControl()
        cancel = null
    })
}