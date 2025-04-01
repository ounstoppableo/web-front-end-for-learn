### 导读

`ESM`，是ECMAScript Modules的缩写，是`javascript`模块的规范语法，自此规范出来之后，杂乱的模块语法：`AMD`、`UMD`、`CommonJs`在未来也将逐渐成为历史的产物，由`ESM`语法统一江湖。

虽然模块语法的内容就那么一点，理解也不难，但是有一些内容还是具有一定的迷惑性和研究价值的，下面的内容首先会介绍`ESM`语法的一些基本内容，然后再就一些具有迷惑性的内容进行讨论。

### ESM的内容

#### 导入导出语法

~~~js
// 导出
// 声明导出：export [default] class/function/variable
export default class A{}
export default function B{}
export class C{}
export function D{} 
export const a = 1;
// 独立的导出：export {x [as y], ...}
const a = 1;
export { a as b};
/*  
	重新导出：
	export {x [as y], ...} from "module"
	export * from "module"
	export {default [as y]} from "module"
*/
export { x as y } from "module";
export * from "module";
export {default as y} from "module";
~~~

~~~js
// 导入
// 命名导入：import {x [as y], ...} from "module"
import {a, b as c} from 'module';
/* 
	默认导入: 
	import x from "module"
	import {default as x} from "module"
*/
import A from 'module';
import {default as A} from 'module';
// 导出所有：import * as obj from "module"
import * as A from "module";
// 仅执行：import "module"
import "module";
~~~

怎么理解模块？我们完全可以将模块看成一个类，只是写在不同的文件，下面是一些简单的类比：

~~~js
// module.js
export const a = 1;
export default { a };

// main.js
import { a, default as module } from "module.js";
~~~

~~~js
class Module {
  a = 1;
  default = { a: this.a };
}
const { a, default: module } = new Module();
~~~

可以看到，变量的声明就类似与属性的定义，需要注意的一个点就是default其实也是一个属性，只不过是内置的，很多人会将default对比为类，这个想法是错的。

在使用类Module的属性时进行了一个实例化，**实际上在模块中这个类的实例化并没有那么简单**，这个问题将在后面章节进行解答。

#### 动态导入

在前面章节我们看到的**导入**语法是静态导入的，静态导入其在编译时就执行了，并不是在程序运行时执行的，也就是说我们无法满足这样一个需求：

**我只需要在特定条件下才进行包的引入**。

~~~js
if(a === true){
    import b from 'module.js';
}❌
~~~

这个需求在应用优化的场景很常见，因为这种情况可以避免在首次加载时就将所有资源都加载过来，减少了加载的流量。

那么我们要如何实现这个需求呢？

答案就是使用**动态导入**。

动态导入的语法非常简单：

~~~js
let modulePath = prompt("Which module to load?");

import(modulePath)
  .then(obj => <module object>)
  .catch(err => <loading error, e.g. if no such module>)
~~~

如果需要赋值：

~~~js
let a,b;

import(modulePath)
  .then(obj => {
    a = obj.a;
    b = obj.b;
  })
  .catch(err => <loading error, e.g. if no such module>)
~~~

因为导出是不变的，我们完全可以像上面章节说的一样，将模块看成一个类，obj就可以类比成new Module()的实例。

### 要点分析

#### 静态导入的注意点

- 声明提前

  我们之前说过，静态导入有一个问题，就是不能依据条件进行引入，虽然语法限制是一个原因，但还有一个原因就是不管它放在哪个位置都会被提前到顶层，比如：

  ~~~js
  sayHallo();
  import sayHallo from 'module.js'
  ~~~

  这样写是完全没问题的，因为import会在编译时就提前了。

- 内容缓存

  导入还有一个功能，那就是内容缓存，这个不只是静态导入、动态导入也是如此，我们前面说过，模块就类似一个类，import引入之后就类似将这个类进行了实例化，但是这个实例的过程是一个单例，我们再用类来举例子：

  ~~~js
  let _module = null;
  class Module {
    a = 1;
    default = { a: this.a };
  }
  function singleCaseFactory(ModuleClass){
      if(!_module) new ModuleClass();
      else return _module;
  }
  const { a, default: module } = singleCaseFactory(Module);
  ~~~

  模块的引入过程应该是如上所述，只要引用过一次，那么下次再引用时就会建立在第一次的基础上，而不会重新构建一个新的模块对象，这意味着我们可以**配置**模块：

  ~~~js
  // 📁 admin.js
  export let admin = {
    name: "John"
  };
  
  // 📁 1.js
  import { admin } from './admin.js';
  alert(admin.name); // John
  admin.name = "Pete";
  
  // 📁 2.js
  import { admin } from './admin.js';
  alert(admin.name); // Pete
  ~~~

  当然，这有一个前提，这`1.js`和`2.js`必须属于同一个执行上下文下：

  ~~~js
  // 📁 main.js
  import '1.js';
  import '2.js';
  ~~~

  这很好理解，因为同一个执行上下文属于同一个进程，只有同一个进程下才能共用虚拟内存空间。

- this问题

  在一个模块中顶层this为undefined

- `import.meta`

  包含关于当前模块的信息，在node环境中通常会将`process.env`映射到`import.meta.env`。

#### 动态导入和静态导入的区别

- 执行时机

  动态导入是在运行时执行的，静态导入是编译时执行的。动态导入就像是函数调用一样，在执行到那一行时才进行调用（不过千万不要误以为动态导入就是函数调用）；而静态导入在编译时会将相关代码打包进同一个文件，并且执行，而且因为其声明提前的特性，它的执行时机会在其被引入的包内先于其他非包引入的语句要早。我们举个例子：

  ~~~js
  // 📁 test.js
  console.log('test file')
  // 📁 test2.js
  console.log ('test2 file')
  
  // main.js
  console.log('main file');
  import ('test2.js');
  import 'test.js';
  
  // 输出
  // test file
  // main file
  // test2 file
  ~~~

- **块级作用域内使用**以及**动态路径**

  ~~~js
  if(modulePath){
      import(modulePath)
  }
  ~~~

#### 循环引入问题

我们来考虑下面情况：

~~~js
// test1.js
import "./test2.js";
console.log("test1文件ended");
~~~

~~~js
import "./test1.js";
console.log("test2文件ended");
~~~

~~~js
// 执行test1.js后，输出：
// test2文件ended
// test1文件ended
~~~

基本机制如下：

- 当 **模块 A** 导入 **模块 B**，而 **模块 B** 反过来又导入 **模块 A** 时，`ESM`会在模块加载过程中缓存已经加载的模块，**返回已经加载的部分**。

> A->B->A，执行到B->A时返回一个对象b给A，然后再执行B剩余的内容，这些内容如果存在导出语句会继续往b中添加属性，A则可以拿到完整的B的内容;
>
> B->A->B，也是同理，执行到A->B时，A返回一个对象a给B，然后执行剩余内容填充a;
>
> A->B->A，执行到B->A时，发现B已经引入过，直接拿到b，循环终止

下面是具体例子：

~~~js
// test2.js文件
export function A() {
  console.log("test2文件A函数");
}
import("./test1.js").then((module) => {
  module.B();
  module.C();
});
console.log("test2文件ended");
~~~

~~~js
// test1.js文件
export function B() {
  console.log("test1文件B函数");
}
import("./test2.js").then((module) => module.A());
export function C() {
  console.log("test1文件C函数");
}
console.log("test1文件ended");
~~~

~~~js
// 执行test1.js后，输出：
// test1文件ended
// test2文件ended
// test2文件A函数
// test1文件B函数
// test1文件C函数
~~~

然后有的读者可能还不放心，认为上面的总结还是不全面，于是他举出一个例子：

~~~js
// test2.js文件
import { B } from "./test1.js";
export function A() {
  B();
}

~~~

~~~js
// test1.js文件
import { A } from "./test2.js";
export function B() {
  A();
}

A();
~~~

这其实就是单纯的函数嵌套了，即使不是模块范畴，也无法执行。

或者还有这种情况：

~~~js
// test2.js文件
import { B } from "./test1.js";
export function A() {
  console.log("test2文件A函数");
}
export { B };

~~~

~~~js
// test1.js文件
import { A, B as C } from "./test2.js";
export function B() {
  A();
}

C();
~~~

~~~js
// 执行test1.js后，输出：
// test2文件A函数
~~~

与之前的解释没有冲突。

#### node环境的ESM

在node中其实是可以直接使用`ESM`的模块引入的，但是很多人对这个地方十分迷惑。

为此我们需要搞清楚node环境中模块引入的规则。

首先这一切都要从`package.json`说起，这是node_modules的核心文件，它的里面有一个我们从未用过的属性——**type**（这也是深受打包工具的迫害，因为打包工具会将`ESM`语法编译成`commonjs`语法，所以他们一般不设置这个属性，不过这也不怪打包工具，因为他们既满足了我们写`ESM`的舒适感，又帮我们拓展了其他类型文件引入的功能，比如图片、css等）。

这个type就是奠定node使用的是`ESM`语法还是`commonjs`模块语法（如果不设置默认为`commonJs`）：

~~~json
{
	type: "module", // 模块语法
}
{
    type: "commonjs", // commonJS语法 
}
~~~

但这个奠定的情况又有些微妙，`package.json`的`type`属性只是针对拓展名为`.js`的文件有效，倘若你的文件有非常清晰的模块拓展名`.mjs`、`.cjs`，那么不论在什么环境都可以正常引入了，只不过引用的时候还是得遵守引入语句规范。我们来看几个例子：

- 环境为`commonJs`

  ~~~json
  // package.json
  {
      "type": "commonjs"
  }
  ~~~

  ~~~js
  // test2.js
  export default function A() {
    console.log("test2文件");
  }
  ~~~

  ~~~js
  // test2.mjs
  export default function A() {
    console.log("test2文件");
  }
  ~~~

  ~~~js
  // test1.js
  import A from 'test2.js';
  //❌不能使用ESM的静态导入语句
  //❌ESM的拓展名不能为js
  ~~~

  ~~~js
  // test1.js
  import('test2.js').then(obj=>obj.default());
  //❌ESM的拓展名不能为js
  ~~~

  ~~~js
  const A = require('./test2.js');
  const A = require('./test2.mjs');
  //❌require不能引入ESM
  ~~~

  ~~~js
  // test1.js
  console.log('test1文件')
  import('./test2.mjs').then(obj=>console.log(obj.default()));
  console.log('test3文件')
  //✔️成功执行，输出：
  //test1文件
  //test3文件
  //test2文件
  ~~~

​	于是我们可以知道，在`commonjs`环境中是可以执行动态引入语句的，并且同样是运行时执行，不会提前。

- 环境为`ESM`

  ~~~json
  // package.json
  {
      "type": "module"
  }
  ~~~

  ~~~js
  // test2.js
  function A() {
    console.log("test2文件外");
  }
  console.log("test2文件内");
  
  exports.module = A;
  ~~~

  ~~~js
  // test2.cjs
  function A() {
    console.log("test2文件外");
  }
  console.log("test2文件内");
  
  exports.module = A;
  ~~~

  ~~~js
  // test1.js
  const A = require('./test2.js')
  //❌ESM语法不能使用require
  ~~~

  ~~~js
  // test1.js
  import A from './test2.js'
  //❌exports.module不适用与ESM导出
  ~~~

  ~~~js
  // test1.js
  console.log("test1文件");
  import test2 from "./test2.cjs";
  test2.module();
  //✔️执行成功，输出：
  //test2文件内
  //test1文件
  //test2文件外
  ~~~

  可以看到即使是`commonjs`模块，在通过`import`静态引入依然能够提前。

  然后还有一个问题，那就是一些系统内置包能否通过`ESM`语法引入：

  ~~~js
  import fs from 'fs';
  console.log(fs);
  //✔️执行成功
  ~~~

  其实看了上面的内容，这个不难理解，只需要在`package.json`配置一个映射就行了，node走`.js`，ESM走`.cjs`。

我们来做个总结吧：

- 没设置`package.json`的`type`属性，环境默认`commonjs`
- 在对应环境中只能使用对应环境的模块语法，并且遵守对应环境的模块执行规则（执行时机）
- 如果希望引入不同模块的文件需要显式设置拓展名
- `commonjs`有动态引入语法，并且引入`ESM`只能通过该语法

#### 浏览器环境的ESM

在浏览器环境使用module语法需要给\<script>标签添加特殊属性：

~~~html
<script type="module">
  import module from './module.js';
</script>
~~~

**在这里实际上import被替换成fetch**。

这种写法实际上没什么用，因为使用`type="module"`进行包裹之后，其他\<script>标签都使用不了其内部的内容，如果仅仅只是做个隔离的话确实也行。

还有一点就是使用`type="module"`之后，\<script>标签会自动添加上defer属性，模块的引入不会阻塞主线程，也就是说，模块脚本会在所有同步脚本执行完后才会执行。这其实和import静态导入声明提前有所违背，所以模块的使用在`html`中才会只用来做隔离。

如果不希望模块脚本阻塞，可以给\<script>标签添加async属性，开启异步执行，但这也仅仅是不阻塞而已，仍不能使模块在所有脚本之前执行，达到声明提前的效果。

为什么浏览器的模块会这样？主要还是出于性能考虑，如果执行一个模块，通常是外部的包，需要请求很长时间，此时所有的脚本都被阻塞，那么用户的体验将会很差。

关于动态import在浏览器中，我们可以直接把其看作fetch，下面是一个例子：

~~~js
// 📁 say.js
export function hi() {
  alert(`Hello`);
}

export function bye() {
  alert(`Bye`);
}

export default function() {
  alert("Module loaded (export default)!");
}
~~~

~~~html
<!doctype html>
<script>
  async function load() {
    let say = await import('./say.js');
    say.hi(); // Hello!
    say.bye(); // Bye!
    say.default(); // Module loaded (export default)!
  }
</script>
~~~

#### 编译时的含义

在上面我们提到很多次**编译时**，比如：静态import是编译时执行的。有的读者可能会有疑惑，明明`javascript`是解释型语言，怎么还会有编译时的情况？实际上虽然是解释型语言，但是还是会进行编译的，只不过并不是将其编译成汇编语言，而是将其编译成c++语言，这其实就是由`v8`引擎完成的。

所以我们前面说的**编译时执行**是什么意思呢？

就是`javascript`在转换成c++语言时，会直接将import静态导入拼接到文件上方，在实际执行的时候，import静态导入的内容就已经确定了。

而动态引入则是在执行的时候，执行到了，c++才去编译并执行引入文件的代码，然后获取结果。

### 参考文献

[ESM介绍](https://zh.javascript.info/modules)

[commonJs模块](http://nodejs.org/docs/latest/api/module.html)