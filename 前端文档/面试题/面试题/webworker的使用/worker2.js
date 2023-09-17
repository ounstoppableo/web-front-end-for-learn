function task() {
    const start = +new Date()
    while (true) {
        if (+new Date() - start >= 5000) {
            break
        }
    }
}
onmessage = () => {
    const start = +new Date()
    task()
    console.log(+new Date() - start)
}