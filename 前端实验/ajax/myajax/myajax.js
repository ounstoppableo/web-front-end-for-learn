// 将数据对象转换成标准字符串的函数
function turnStr(data) {
    if (typeof data !== 'object') {
        return ''
    }
    let arr = []
    for (let k in data) {
        arr.push(`${k}=${data[k]}`)
    }
    return arr.join('&')
}

// ajax函数,传递对象中含有的参数:method\url\data\success方法
function myAjax(data) {
    const xhr = new XMLHttpRequest()
    let str = typeof data.data === 'string' ? data.data : turnStr(data.data)
    if (data.method.toUpperCase() === 'GET') {
        xhr.open('get', `${data.url}?${str}`)
        xhr.send()
    } else if (data.method.toUpperCase() === 'POST') {
        xhr.open('post', `${data.url}`)
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        xhr.send(str)
    } else {
        return alert('请输入正确的请求方式')
    }
    xhr.addEventListener('load', () => {
        const result = JSON.parse(xhr.responseText)
        data.success(result)
    })
}

// 上传文件函数
function upLoad(btnStr, fileStr) {
    const btn = document.querySelector(btnStr)
    btn.addEventListener('click', () => {
        const file = document.querySelector(fileStr)
        // 判断是否选择了文件
        if (!file.files[0]) {
            return alert('请选择文件')
        }
        // 将文件添加至formdata对象，方便上传
        const fd = new FormData()
        fd.append('avatar', file.files[0])
        const xhr = new XMLHttpRequest()
        // 上传开始时添加bootstrap的进度条组件
        xhr.addEventListener('loadstart', () => {
            if (!document.querySelector('.progress')) {
                const div = document.createElement('div')
                div.classList.add('progress')
                div.style.width = '500px'
                div.innerHTML = `
                <div class="progress-bar progress-bar-striped active" style="width: 0%">
                     0%
                </div>
                `
                document.body.append(div)
            } else {
                const progress = document.querySelector('.progress')
                progress.children[0].classList.toggle('progress-bar-success')
                progress.children[0].innerHTML = '0%'
                progress.children[0].style.width = '0%'
            }
        })
        // 添加上传进度检测事件
        xhr.upload.onprogress = function (e) {
            const progress = document.querySelector('.progress')
            const now = Math.floor(e.loaded / e.total * 100) + '%'
            progress.children[0].innerHTML = now
            progress.children[0].style.width = now
        }
        // 上传结束后判断传输是否成功
        xhr.addEventListener('load', () => {
            const progress = document.querySelector('.progress')
            const res = JSON.parse(xhr.responseText)
            if (res.status === 200) {
                progress.children[0].classList.add('progress-bar-success')
                progress.children[0].innerHTML = '传输完成'
                console.log(res);
                document.querySelector('img').src = `http://www.liulongbin.top:3006${res.url}`
            }
        })
        xhr.open('post', 'http://www.liulongbin.top:3006/api/upload/avatar')
        xhr.send(fd)
    })
}