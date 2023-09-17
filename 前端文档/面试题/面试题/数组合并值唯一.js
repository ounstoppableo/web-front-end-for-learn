function dealArr(arr1, arr2) {
    if (!(arr1 instanceof Array) || !(arr2 instanceof Array)) throw new Error('type Error!')
    return Array.from(new Set([...arr1.flat(), ...arr2.flat()]))
}
// console.log(dealArr(["a", 1, 2, 3, ["b", "c", 5, 6]], [1, 2, 4, "d", ["e", "f", "5", 6, 7]]))
