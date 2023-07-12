const table = document.querySelector('table')
table.addEventListener('click',(e)=>{
    if(e.target.nodeName === 'TD'){
        e.target.classList.toggle('active')
    }
})