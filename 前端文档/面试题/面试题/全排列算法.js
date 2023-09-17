function allSort(arr) {
    if (arr.length === 0) return []
    if (arr.length === 1) return [arr]
    if (arr.length === 2) return [arr, arr.reverse()]
    const result = []
    arr = Array.from(new Set(arr))
    for (let i = 0; i < arr.length; i++) {
        const recurArr = arr.filter(item => item != arr[i])
        const recurRes = allSort(recurArr)
        recurRes.forEach(item => {
            result.push([arr[i], ...item])
        })

    }
    return result
}
console.log(allSort([1, 2, 3, 4, 5, 6]))