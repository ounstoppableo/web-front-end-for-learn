function MyObj() {
    this.name = 'myobj'
}
MyObj.prototype.valueOf = function () {
    console.log('this is valueOf method')
}
MyObj.prototype.toString = function () {
    console.log('this is toString method')
}
const obj = new MyObj()
console.log(obj == 1)