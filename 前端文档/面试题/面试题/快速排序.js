// function quickSort(arr, left, right) {
//     let len = arr.length
//     let _left = typeof left != 'number' ? 0 : left
//     let _right = typeof right != 'number' ? len : right
//     if (_left < _right) {
//         let partitionIndex = partition(arr, _left, _right)
//         quickSort(arr, _left, partitionIndex)
//         quickSort(arr, partitionIndex + 1, _right)
//     }
//     return arr
// }
// function partition(arr, left, right) {
//     let p = left
//     let index = left + 1
//     for (let i = index; i < right; i++) {
//         if (arr[i] < arr[p]) {
//             swap(arr, i, index)
//             index++
//         }
//     }
//     swap(arr, p, index - 1)
//     return index - 1
// }
// function swap(arr, i, j) {
//     let temp = arr[i]
//     arr[i] = arr[j]
//     arr[j] = temp
// }
console.log(quickSort2([1, 5, 3, 2, 6, 4, 8]).length)
function swap(arr, i, j) {
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
}
function partition(arr, left, right) {
    let p = left
    let index = left + 1
    for (let i = index; i < right; i++) {
        if (arr[i] < arr[p]) {
            swap(arr, i, index)
            index++
        }
    }
    swap(arr, p, index - 1)
    return index - 1
}
function quickSort2(arr, left, right) {
    const len = arr.length
    const _left = typeof left === 'number' ? left : 0
    const _right = typeof right === 'number' ? right : len
    if (_left < _right) {
        const partitionIndex = partition(arr, _left, _right)
        quickSort2(arr,left, partitionIndex)
        quickSort2(arr,partitionIndex + 1, _right)
    }
    return arr
}