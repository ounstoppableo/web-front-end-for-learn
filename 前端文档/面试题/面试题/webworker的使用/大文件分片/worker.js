function createChunk(file, index, size) {
    return new Promise((resolve, reject) => {
        const start = index * size
        const end = start + size > file.size ? file.size : start + size
        const fileReader = new FileReader()
        fileReader.onload = (e) => {
            resolve({
                start,
                end,
                index,
                size: end - start,
                result: e.target.result
            })
        }
        fileReader.readAsArrayBuffer(file.slice(start, end))
    })
}
onmessage = async (e) => {
    const { startIndex, endIndex, file, CHUNK_SIZE } = e.data
    const proms = []
    for (let i = startIndex; i < endIndex; i++) {
        proms.push(createChunk(file, i, CHUNK_SIZE))
    }
    const chunks = await Promise.all(proms)
    postMessage(chunks)
}