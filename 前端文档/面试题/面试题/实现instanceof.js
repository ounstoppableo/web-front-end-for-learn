function myInstanceOf(val, Constructor) {
    if (typeof val === 'object' || typeof val === 'function') {
        if (val.__proto__) {
            if (Constructor === val.__proto__.constructor) return true
            return myInstanceOf(val.__proto__, Constructor)
        } else {
            return false
        }
    } else {
        return false
    }
}
console.log(myInstanceOf(1, Object))