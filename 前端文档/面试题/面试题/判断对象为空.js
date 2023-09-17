function isEmptyObject(obj) {
    return '{}' === JSON.stringify(obj)
}
function isEmptyObject2(obj) {
    return Object.keys(obj).length === 0
}
function isEmptyObject3(obj) {
    return Object.getOwnPropertyNames(obj).length === 0
}
function isEmptyObject4(obj) {
    for (let key in obj) {
        if (key) return false
    }
    return true
}
function isEmptyObject5(obj) {
    return Reflect.ownKeys(obj).length === 0
}

const a = Symbol('a')
console.log(isEmptyObject4({ [a]: 1, a: 1 }))
