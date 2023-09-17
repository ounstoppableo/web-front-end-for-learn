//版本号比较，如果只是开发中比较的版本比较少，可以直接使用split或其他字符串分割来实现
//但是遇到百万级别的版本比较，spilt内部有隐性遍历，这样效率就比较低了，所以考虑到使用迭代器
function* walk(str) {
    let part = ''
    let teminal = ['.', '-']
    for (let i = 0; i < str.length; i++) {
        if (teminal.includes(str[i])) {
            //遇到yield其实就类似于打断点，next()则是从断点开始执行
            yield part
            part = ''
        } else {
            part += str[i]
        }
    }
    if (part) yield part
}
//12.3.1  12.7.8 
//比较函数
function compare(...rest) {
    //初始化迭代
    let literator = []
    //记录next()得到的值
    let n = []
    //记录最大值的下标
    let ans = -1
    for (let i = 0; i < rest.length; i++) {
        literator[i] = walk(rest[i])
        n[i] = literator[i].next()
    }
    //判断是否已经进入比较
    while (ans === -1) {
        let max = 0
        let equl = false
        let breakFlag = false
        // 比较
        for (let i = 0; i < literator.length; i++) {
            if (+n[i].value > +n[max].value) {
                max = i
            } else {
                equl = true
            }
        }
        //全部相等的情况进行迭代
        if (equl && max === 0) {
            let num = 0
            for (let i = 0; i < literator.length; i++) {
                //如果状态为done，则不进行迭代，并且记录done的个数
                if (n[i].done) {
                    num++
                    n[i] = -1
                } else {
                    n[i] = literator[i].next()
                }
            }
            //done的个数为literator的个数，则中断循环
            if (num === literator.length) breakFlag = true
        } else {
            ans = max
        }
        if (breakFlag === true) break
    }
    return ans
}
console.log(compare('12.3.1', '12.3.1'))