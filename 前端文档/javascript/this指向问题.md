### 导读

this指向问题是javascript里最基本，但也是最核心的问题。有时候读者会认为自己在这方面认识的很透彻了，但是在某些场景下可能又会犯迷糊。本篇文章主要针对这一痛点，将比较全面的介绍关于javscript的this指向问题。

### this指向问题

#### 箭头this和动态this

一般来说，this在javascript只分为两类，**箭头函数内的this**和**普通函数内的this**。

但其实我更喜欢把它们归类为**箭头this**和**动态this**。

- 动态this

  动态this理解起来很简单，this的值随着调用方式改变：

  ~~~js
  function fn(){
  	console.log(this)
  }
  fn() // window
  const obj = {};
  obj.fn = fn;
  obj.fn() //obj
  ~~~

- 箭头this

  一般在箭头函数中出现：
  ~~~javascript
  const obj = {
      fn:() => {
          console.log(this);
      }
  }
  obj.fn()
  // window
  ~~~

  我们看到其值不随调用方式改变而改变，但是也有例外情况：

  ~~~js
  const obj = {
      name: 'obj',
      fn: function(){
          (()=>{
              console.log(this);
          })()
  	}
  }
  obj.fn(); // obj
  const obj2 = {name: 'obj2'};
  obj2.fn = obj.fn;
  obj2.fn(); // obj2
  ~~~

  网上有一个对箭头函数内this的一个总结：**由定义时的词法作用域中的this决定**，简单来说就是由箭头函数的上一个大括号的this决定。

#### call/apply/bind

在call/apply/bind中箭头this和动态this有不同的行为：

- 动态this

  动态this会完全受call/apply/bind支配，这种也被称为**显示this绑定**：

  ~~~js
  function fn(){
  	console.log(this)
  }
  const obj = {};
  fn.call(obj) // obj
  fn.apply(obj) // obj
  fn.bind(obj)() // obj
  ~~~

- 箭头this

  箭头this则是完全不受影响：
  ~~~js
  const fn = () => {
  	console.log(this)
  }
  const obj = {};
  fn.call(obj) // window
  fn.apply(obj) // window
  fn.bind(obj)() // window
  ~~~

#### 构造函数和类

构造函数一般都是使用普通函数的语法：

~~~js
function Obj(name){
    this.name = name
	console.log(this)
}
const obj = new Obj('obj'); // Obj {}
~~~

我们将构造函数的执行（new）拆解一下：
~~~js
function newAObj(fn, ...args){
    const _obj = Object.create(fn.prototype);
    const result = fn.call(_obj,...args);
    if (typeof result === "object" && result !== null) {
  		return result;
	}
    return _obj
}
~~~

这里面使用到了call方法，也就是说如果将构造函数利用箭头函数定义，那么构造将失败，因为this将始终指向window。

那么在类中，this又有什么样的行为呢？

~~~js
class AClass {
    fn(){
        console.log(this)
    }
}
const obj = new AClass();
obj.fn(); // AClass {}
~~~

上面的例子很简单，类的实例化就像是构造函数的实例化一样。

如果我们稍微复杂一点：

~~~js
class AClass {
    fn(){
        console.log(this)
    }
}
class BClass extends AClass{
    constructor(){
        super()
    }
}
const obj = new BClass();
obj.fn(); // BClass{}
~~~

可以看到，this的指向还是符合我们的预期。这就是动态this的简单之处，只需要确定了调用函数的方式，就能知道this的值，如果换成箭头函数会怎么样呢？

~~~js
class AClass {
    fn = () => {
        console.log(this)
    }
}
const obj = new AClass();
obj.fn(); // AClass {fn: ƒ}
~~~

此时，我们发现了盲点，箭头函数的值可能和一些读者猜测的值不一致，受到对象中的箭头函数的影响，我们会想当然的认为class中的箭头函数也会指向window：

~~~js
const obj = {
	fn: () => {
		console.log(this);
	}
}
obj.fn() // window
~~~

此时对象的块级作用域并不存在this，或者说**this只会在函数的块级作用域中出现**，那么为什么类中的this会指向obj呢？此时我们稍微将类的定义换一下表达方式：

~~~js
class AClass {
  constructor(name) {
    this.name = name;
  }

  fn1() {
    console.log(this);
  }

  static fn2() {
    console.log(this)
  }
  
  fn3 = () => {
      console.log(this)
  }
}

// 构造函数
function AClass(name) {
  this.name = name;
  this.fn3 = () => {
      console.log(this);
  }
}

// 原型方法 (等价于 class 中的实例方法)
AClass.prototype.sayHello = function() {
  console.log(this);
};

// 静态方法 (直接挂在构造函数对象上)
AClass.fn2 = function() {
  console.log(this);
};
~~~

现在读者应该知道this为什么指向obj了，因为构造函数AClass在运行时指向obj，而内部的箭头函数跟随上一层的块作用域，于是也指向obj。

那如果是继承的情况下，this又是指向谁呢？

~~~js
class AClass {
    fn = () => {
        console.log(this)
    }
}
class BClass extends AClass{
    constructor(){
        super()
    }
}
const obj = new BClass();
obj.fn(); // BClass {fn: ƒ}
~~~

没什么大问题，不过我们同样也是拆解一下：

~~~js
function BClass(...args) {
	AClass.call(this, ...args); // super
}
~~~

到这里关于构造函数和类中的this就介绍结束了。

#### 代理

关于代理里的this，其实严格来说不算是this的知识点，但是我在这里还是要提一下：

~~~js
let user = {
  _name: "Guest",
  get name() {
    return this._name;
  }
};

let userProxy = new Proxy(user, {
  get(target, prop, receiver) {
    return target[prop]; // (*) target = user
  }
});

let admin = {
  __proto__: userProxy,
  _name: "Admin"
};

// 期望输出：Admin
alert(admin.name); // 输出：Guest (?!?)
~~~

正常来说，我们期望`admin.name`为Admin，但是为什么输出却是Guest呢？

主要是因为`admin`没有`name`属性，所以会去原型上查找，于是查找到`userProxy`，而`userProxy`代理的是`user`，于是`get(target , prop, receiver)`中`target`就为`user`，所以我们访问`target[prop]`时，实际上访问的是`user.name`，此时`name`的`getter`中的`this`就指向`user`，所以输出Guest。

那么我们要怎么修改，才能有正确的结果的？此时我们知道`target===user`，而`receiver`表示的是当前的调用方式，我们是通过`admin.name`来调用的，所以`receiver`显然是`admin`。意思是我们将`target[prop]`改为`receiver[prop]`就行了是吗？

~~~js
let userProxy = new Proxy(user, {
  get(target, prop, receiver) { // target=user;receiver=admin
    return receiver[prop];
  }
});
~~~

很遗憾，这是错误的设置方法，如果这样做我们会陷入无限递归：

~~~js
// admin.name -> receiver[name] -> admin.name -> ...
~~~

正确的做法应该是利用Reflect：

~~~js
let userProxy = new Proxy(user, {
  get(target, prop, receiver) { // target=user;receiver=admin
    return Reflect.get(target, prop, receiver);
  }
});
~~~

很多读者不能理解Reflect的作用，认为Reflect是多余的，但是在上面的案例中就能很好反应Reflect的作用，它能很好的模拟上下文，并基于此上下文进行相关操作的代理执行。

### 总结

**函数调用**：默认全局（严格模式下 `undefined`）

**对象方法**：调用者对象

**构造函数 / class**：新实例

**显式绑定**：`call` / `apply` / `bind`

**箭头函数**：定义时的外层作用域

**事件处理**：绑定的元素（箭头函数除外）

**模块顶层**：ESM → `undefined`，CJS → `exports`

### 参考文献

[对象方法，"this"](https://zh.javascript.info/object-methods)

[Class 基本语法](https://zh.javascript.info/class)

[Proxy 和 Reflect](https://zh.javascript.info/proxy)