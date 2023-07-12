## 优化相关

### CSS

#### transform

##### margin

> 假如实现歌词滚动效果，歌词向上位移，这时候有两种方式：
>
> margin-top：负值；transform: translateY(负值)
>
> 那么选用哪种好呢？
>
> 答案是transform
>
> 因为页面渲染原理，改变margin就改变了几何信息，这样页面就需要重新布局，布局的后续步骤都需要重新执行
>
> 而transform只会触发draw，明显比margin快很多

##### font-size

> font-size也会导致几何信息发生改变，以至于需要重新布局，这对页面加载很不友好
>
> 所以font-size不适合用来进行页面交互
>
> 这时候字体放大可以使用transform: scale()

### JS

#### 属性描述符

> 在传递数据，将数据通过构造函数变成对象时，或其他情况
>
> 会有数据被重新赋值，然后导致数据丢失的情况
>
> 这时候就可以利用属性描述符进行安全设置
>
> 但有时候设置了属性描述符，其他人若想更改发现更改不了，也不知道原因，这种情况非常糟糕
>
> 所以一般会通过添加***读取器***和***设置器***解决该问题

##### Object.getOwnPropertyDescriptor() 得到属性描述符

~~~javascript
const obj = {
    a: 1,
    b: 2
}
const desc = Object.getOwnPropertyDescriptor(obj,'a')
console.log(desc) //value:1,writable(可修改):true,enumerable(可遍历):true,configurable(描述符可修改):true
~~~

##### Object.defineProperty() 修改属性描述符

~~~javascript
const obj = {}
Object.defineProperty(obj,'a',{
                             value: '10',
    						writable: false, //不可修改
    						enumerable: false, //不可遍历
    						configurable: false, //描述符不可修改
                             })
~~~

~~~javascript
const obj={}
let internalVal = undefined
Object.defineProperty(obj,'a',{ //defineProperty有创建属性的功能
    //访问器
    get: function(){
        return internalVal
    }, //读取器
    set: function(val){
    	internalVal = val
} 	//设置器
})
//给obj.a加上get()或set()后
//访问obj.a等价于运行get()
//运行obj.a=1+1等价于运行set(1+1)

//defineProperty使用注意事项
const obj0={a:1}
Object.defineProperty(obj0,'a',{
    get: function(){
        return obj0.a //return get(),进入死循环
    },
    set: function(val){
    	obj0.a = val //会变成set() = val,进入死循环
	}
})

//使用读取器和设置器解决只读数据的问题
const obj1={}
Object.defineProperty(obj1,'a',{
    get: function(){
        return 123
    },
    set: function(val){
    	throw new Error('抱歉，这是只读属性')
	}
})

//或者使用读取器和设置器解决只能赋予某数据类型的问题
const obj2={}
let internalVal = undefined
Object.defineProperty(obj2,'a',{
    get: function(){
        return internalVal
    },
    set: function(val){
    	if(typeof val !== 'number') throw new Error('不是数字')
        if(parseInt(val) !== val) throw new Error('不是整数')
        internalVal = val
	}
})
~~~



## 一些skills

### CSS

##### transition

> transition写在发生改变的元素上
>
> transition针对的都是数值类的属性
>
> 比如display: block->none，这个就无法使用transition
>
> 但是opacity: 1->0，就可以使用
>
> 所以颜色之类的都可以过渡，因为rgba(0,0,0)，#ffffff之类的都是数值

## 面向对象思想

> 假设有一个对象，对象内有若干零件
>
> UI界面需要操作一个功能，这个功能在对象内的某一个零件有相应的方法
>
> 这时，最好不要直接对零件调用，而是把零件内的方法传递给该对象
>
> 使得我们的操作总是在最外层，就如微波炉，只需要操作微波炉的按钮，而不需要去操作内部的零件

