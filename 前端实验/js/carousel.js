function animate2(obj, distance, callback) {
    clearInterval(obj.timer);
    var hadmove = 0;
    obj.timer = setInterval(function () {
        var step = (distance - hadmove) / 10;
        step = step > 0 ? Math.ceil(step) : Math.floor(step);
        if (hadmove == distance) {
            clearInterval(obj.timer);
            if (callback) {
                callback();
            }
        }
        obj.style.left = obj.offsetLeft + step + 'px';
        hadmove += step;
    }, 15)
}
window.addEventListener('load', function () {
    var focus = document.querySelector('.focus');
    var left = document.querySelector('.left');
    var right = document.querySelector('.right');
    var pics = document.querySelector('.pics');
    var dots = document.querySelector('.dots');
    var flag = true;
    for (var i = 0; i < pics.children.length; i++) {
        var li = document.createElement('li');
        dots.appendChild(li);
        dots.children[i].setAttribute('data-index', i + 1);
    }
    pics.i = 1;
    focus.addEventListener('mouseover', function () {
        left.style.display = 'block';
        right.style.display = 'block';
        clearInterval(timer0);
        timer0 = null;
    })
    focus.addEventListener('mouseout', function () {
        left.style.display = 'none';
        right.style.display = 'none';
        timer0 = setInterval(function () {
            right.click();
        }, 2000)
    })
    right.addEventListener('click', function () {
        if (flag == true) {
            flag = false;
            if (pics.i <= pics.children.length) {
                pics.i++;
                if (pics.i == pics.children.length + 1) {
                    animate2(pics, focus.offsetWidth*(pics.children.length-1), function () {
                        flag = true;
                    });
                    pics.i = 1;
                    for (var j = 0; j < dots.children.length; j++) {
                        dots.children[j].style.backgroundColor = '#aaa'
                    }
                    dots.children[0].style.backgroundColor = '#fff';
                } else {
                    for (var j = 0; j < dots.children.length; j++) {
                        dots.children[j].style.backgroundColor = '#aaa'
                    }
                    dots.children[pics.i - 1].style.backgroundColor = '#fff';
                    animate2(pics, -focus.offsetWidth, function () {
                        flag = true;
                    })
                }

            }
        }
    })
    left.addEventListener('click', function () {
        if (flag == true) {
            flag = false;
            if (pics.i > 0) {
                pics.i--;
                if (pics.i == 0) {
                    animate2(pics, -focus.offsetWidth*(pics.children.length-1), function () {
                        flag = true;
                    });
                    pics.i = 4;
                    for (var j = 0; j < dots.children.length; j++) {
                        dots.children[j].style.backgroundColor = '#aaa'
                    }
                    dots.children[3].style.backgroundColor = '#fff';
                } else {
                    for (var j = 0; j < dots.children.length; j++) {
                        dots.children[j].style.backgroundColor = '#aaa'
                    }
                    dots.children[pics.i - 1].style.backgroundColor = '#fff';
                    animate2(pics, focus.offsetWidth, function () {
                        flag = true;
                    })
                }
            }
        }
    })
    for (var i = 0; i < dots.children.length; i++) {
        dots.children[i].addEventListener('click', function () {
            if (flag == true) {
                flag = false;
                for (var j = 0; j < dots.children.length; j++) {
                    dots.children[j].style.backgroundColor = '#aaa'
                }
                this.style.backgroundColor = '#fff';
                var hadMove = (pics.i - 1) * (-focus.offsetWidth);
                var ditIndex = parseInt(this.getAttribute('data-index'));
                var needMove = (ditIndex - 1) * (-focus.offsetWidth) - hadMove;
                animate2(pics, needMove, function () {
                    flag = true;
                });
                pics.i = ditIndex;
            }
        })
    }
    var timer0 = setInterval(function () {
        right.click();
    }, 2000)
})

