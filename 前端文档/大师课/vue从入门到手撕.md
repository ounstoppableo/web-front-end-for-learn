### VUE的概念性学习

#### 展现VUE

##### 先创建VUE实例(在JS代码中)

~~~javascript
const vm = new Vue({
    //配置属性
    el: 'css选择器', //一般是把整个页面都选上，然后被选上的页面就会被VUE控制，然后在html中就可以添加VUE语法
    data: {
        //界面数据，
        title: '名字',
    },
    //计算属性
    computed: {
        count: function(){} //本身不存在，根据原始数据计算出来，解决数据冗余问题
    }
})
~~~

例子：

~~~html javascript
<div class="container">
    <h1 class="head">{{title}}</h1> <!-- 当页面被控制后，可以像这样添加VUE语法{{}} -->
    <div class="goods-list">
        <div class="good-item" v-for=“item in goods” :class="{active: item.choose>0}">
            <!-- v-for是循环遍历数据，:class类似于if判断 -->
        </div>
    </div>
</div>
<script>
    const vm = new Vue({
    el: '.container',
    data: {
        title: '京东商城',
		goods: goods,
		total: 0
    },
})
</script>
~~~

#### 走进VUE作者的内心世界

~~~javascript
function observe(obj){
    for(let key in obj){
        let internalVal = obj[key]
        const funcs = []
        Object.defineProperty(obj,key,{
            get: function(){
                //依赖搜集,记录：哪个函数在用我
                if(window.__func && !funcs.includes(window.__func)){
                    funcs.push(window.__func)
                }
                return internalVal
            }
            set: function(val){
            	internalVal = val
            	//派发更新,运行：执行用我的函数
            	for(let i = 0;i < funcs.length; i++){
                    funcs[i]()
                }
        	}
        })
    }
}

//记录哪个函数被使用
function autorun(fn){
    window.__func = fn
    fn()
    window.__func = null
}
~~~



#### 数据响应式

> 粗犷解释：页面会随着数据的改变而改变，比如上面title发生改变后，页面显示的内容也发生改变
>
> 详细解释：当数据发生变化时，会调用相应的函数，这个函数操作页面使页面变化
