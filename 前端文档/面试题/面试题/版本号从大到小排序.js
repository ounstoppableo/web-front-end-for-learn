function versionSort(arr) {
    return arr.sort((a, b) => {
        let i = 0
        const arr1 = a.split('.')
        const arr2 = b.split('.')
        while (true) {
            const s1 = arr1[i]
            const s2 = arr2[i]
            i++
            if (s1 === undefined || s2 === undefined) {
                return arr2.length - arr1.length
            }
            if (s1 === s2) continue
            return s2 - s1
        }
    })
}
console.log(versionSort(['2.1.0.1', '0.402.1', '10.2.1', '5.1.2', '1.0.4.5']))