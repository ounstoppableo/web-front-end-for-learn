onmessage = function (event) {
    this.postMessage(Fibonacci(+event.data))
}
const map = new Map()
function Fibonacci(n) {
    if (n === 1 || n === 0) {
        map.set(n, 1)
        return 1
    }
    if (map.get(n)) return map.get(n)
    let num = Fibonacci(n - 1) + Fibonacci(n - 2)
    map.set(n, num)
    return num
}