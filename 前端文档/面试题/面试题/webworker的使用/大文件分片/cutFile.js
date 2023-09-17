const CHUNK_SIZE = 1024 * 1024 * 5
const TREAD_COUNT = 4
async function cutFile(file) {
    return new Promise((resolve, reject) => {
        const CHUNK_COUNT = Math.ceil(file.size / CHUNK_SIZE)
        const chunkArr = []
        for (let i = 0; i < TREAD_COUNT; i++) {
            const worker = new Worker('./worker.js', { type: 'module' })
            const gap = Math.ceil(CHUNK_COUNT / TREAD_COUNT)
            const startIndex = gap * i
            const endIndex = startIndex + gap > CHUNK_COUNT ? CHUNK_COUNT : startIndex + gap
            worker.onmessage = (e) => {
                e.data.forEach((item, index) => {
                    chunkArr[startIndex + index] = item
                })
                if (chunkArr[CHUNK_COUNT - 1]) resolve(chunkArr)
            }
            worker.postMessage({ file, startIndex, endIndex, CHUNK_SIZE })
        }
    })
}