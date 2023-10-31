const demo = new Proxy({
    _store: 0
}, {
    get(target, val, reciver) {
        //表示要进行强制类型转换
        if (val === Symbol.toPrimitive) {
            //强制类型转换时必须返回一个函数，因为内部会将返回值当作函数来调用
            return () => {
                return +target._store
            }
        }
        target._store += +val
        return reciver
    }
})

console.log(100 + demo[5][6])