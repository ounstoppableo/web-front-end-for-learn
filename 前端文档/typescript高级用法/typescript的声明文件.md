### 导读

本篇文章属于typescript高级用法合集中的一个小节，typescript高级用法合集中包含了对泛型、声明、模块、命名空间等高级用法的详细解读，非常利于提升typescript使用理解和进阶提升。

[点我去到typescript高级用法合集页~]()

### 声明的作用

在学习typescript时，我们一定有听说过声明，但是可能从来没有真正接触过，或许就是在引入第三方包时附加的下载了`@types/`开头的包而已。

声明到底有什么作用呢？

实际上从typescript的作用出发就很好理解声明的作用，typescript的核心作用离不开一点：**定义类型，使代码可读性更强**。声明的作用也是如此。

我们总览一下typescript，可以发现其定义类型的方式其实就两种：

- 使用type定义类型
- 使用declare定义类型

所以要弄清楚声明的作用，**其实关键就是弄清楚type定义的类型和declare定义的类型究竟有什么区别，而它们的最终效果都是为我们的代码定义类型。**

所以type和declare有什么区别呢？我们先来看一个例子：

~~~ts
type someType = {
    someAttr: number
}
const obj:someType = {
    someAttr: 1
}
const fn:()=>someType = ()=>{
    return {
        someAttr: 1
    }
}
~~~

我们发现利用type定义的类型实际上还需要进行第二步操作才能发挥作用：**绑定**。在我们编写typescript代码时使用这样的方式或许很正常，但如果我们已经事先写好了一大串不带type的js代码，我们还能这样去写吗？虽然也可以但是十分麻烦，于是我们就可以利用declare来进行类型声明。

~~~ts
// 实现写好的js文件
const fn = ()=>{
    return {
        someAttr: 1
    }
}
~~~

~~~ts
// .d.ts声明文件
type someType = {
    someAttr: number
}
declare fn: ()=>someType
~~~

这样写之后是不是能很清楚的把类型和实现取消耦合，达到满足开放闭合原则。

所以我们可以**总结声明的作用**：

- 本质上还是为了定义类型
- 为了使类型定义和原始js代码分离，达到开放闭合的原则
- 为了兼容以前没使用typescript编写的工具代码，使我们能在不改变源代码的情况下更方便的定义类型
- 给出抽象的代码释义，让使用者只关注其功能和用法而不是具体实现

假设我们编写的库就是完全基于typescript的开发，那么我们还需要在进行文件声明吗？

- 首先我们需要明确一点，就是我们上传到npm的库一般都是经过编译的，也就是不包含ts文件的，因为如果一个库依赖于ts文件，那么使用这个库就必须要依赖typescript库，这在npm这个javascript库中会不会有种谋权篡位的感觉？如果只是自己公司内部使用的库那就另当别论。

- 然后第二点就是，我们在前面提到的声明的作用有`给出抽象的代码释义，让使用者只关注其功能和用法而不是具体实现`，显然行内嵌入type的类型声明方式并不能满足这一点。

所以文件声明还是十分必要的~

### 声明的作用范围

在说明声明的作用范围之前，我们需要先弄清楚typescript的声明生成方式：

- 自动生成

  ~~~sh
  tsc --declaration
  ~~~

  当我们执行上面的指令时，每个ts文件就会输出一个js文件和一个d.ts文件，它们的关系如下：

  ![](.\images\declaration-files.svg)

- 手动生成

  或者我们也可以手动去定义d.ts文件，就像在`声明的作用`中所做的一样，但是请注意一点：**声明拓展名前的文件名请保持和js拓展名前的文件名一致**。

> 我们了解了typescript的声明生成方式，但是具体应该使用哪个呢？
>
> 对于自动生成的d.ts文件无法避免的会缺失许多细节，这时候就需要我们进行手写补充，但是通过tsc生成的d.ts能够很好的进行文件对应，满足上图的关系，使得声明文件能够很好的生效，所以建议是两个方式同时使用，自动用于生成d.ts文件，手写用于补充细节。

知道了声明的生成方式后，我们其实就可以推导出**声明的作用范围实际上就是声明的查找规则**，声明文件并不能直接引入到某个ts文件中，那么这些声明文件是怎么起作用的呢？我们来看看其规则：

- 初始化的情况下，typescript的默认识别声明文件名称为`index.d.ts`或`global.d.ts`，其作用域的范围是`**/*`，也就是递归`tsconfig.json`所在的文件夹下的所有子文件，如果要手动设置其范围也可以设置`tsconfig.json`的“compilerOptions”属性下的“typeRoots”。

- 如果需要自定义声明文件名称，也可以在`tsconfig.json`的“compilerOptions”属性下的“types”进行配置，比如：

  ~~~json
  // tsconfig.json
  {
    "compilerOptions": {
      "types": [
        "./a.d.ts"
      ]
    },
  }
  ~~~

  就可以查找到根文件下的a.d.ts了，这里的路径不能为正则表达式。

  除了这种方式也可以通过在index.d.ts文件中使用：

  ~~~ts
  /// <reference types="a.d.ts" />
  ~~~

  来进行声明覆盖。

> 有几个注意点：
>
> - 对于包，找不到模块“xxx”或其相应的类型声明
>
>   只要我们在node_modules/xxx文件夹下或node_modules/@types/xxx文件夹下存在能被typescript识别的声明文件(index.d.ts/global.d.ts)，typescript就会自动推断xxx包的存在，此时就不需要显式的定义`declare module xxx`了。
>
> - 对于tsconfig.json报错或其他类型报错，但是我们的配置已经确认是没错的
>
>   我们或许只需要刷新以下tsconfig.json即可解决报错，这似乎是一个缓存问题，**我们可以通过注释tsconfig.json再解除注释刷新**。

### namespace的特殊性

我们知道const、let、function甚至type都只能声明一次，比如：

~~~ts
type A = number;
type A = string; // Error
~~~

但是命名空间可以重复定义，typescript会将它们合并起来：

~~~ts
namespace X {
  export interface Y {}
  export class Z {}
}

// 重复定义X，但被允许
namespace X {
  export var Y: number;
  export namespace Z {
    export class C {}
  }
}

// 只有type、interface、class能与namespace用同样的变量名
type X = string;
~~~

这里非常容易弄混，第一个X导出的Y是一个类型，第二个X导出的Y是一个值，所以我们的用法略有区别：

~~~ts
// 使用第一个X导出的Y
const someValue:X.Y = {};
~~~

~~~ts
// 使用第二个X导出的Y
X.Y = 1;
~~~

这也是namespace能合并的原因，如果两个namespace中都定义了同类型或同值的同变量名，那还是会报错的，比如：

~~~ts
namespace X {
  export interface Y {}
}
// ... elsewhere ...
namespace X {
  export type Y = number; // 标识符“Y”重复
}
~~~

### 声明的最佳实践

#### 不应该使用js的内置类作为类型

不要使用 `Number` 、 `String` 、 `Boolean` 、 `Symbol` 或 `Object` 这些类作为类型，比如：

~~~ts
/* WRONG❌ */
function reverse(s: String): String;
~~~

应该这样写：

~~~ts
/* OK✅ */
function reverse(s: string): string;
~~~

#### 利用void代替any作为空返回值类型

~~~ts
/* WRONG❌ */
function fn(x: () => any) {
  x();
}
~~~

~~~ts
/* OK✅ */
function fn(x: () => void) {
  x();
}
~~~

#### 尽可能的合并重载

~~~ts
/* WRONG❌ */
declare function beforeAll(action: () => void, timeout?: number): void;
declare function beforeAll(
  action: (done: DoneFn) => void,
  timeout?: number
): void;

/* WRONG❌ */
interface Example {
  diff(one: string): number;
  diff(one: string, two: string): number;
  diff(one: string, two: string, three: boolean): number;
}

/* WRONG❌ */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number): Moment;
  utcOffset(b: string): Moment;
}
~~~

~~~ts
/* OK✅ */
declare function beforeAll(
  action: (done: DoneFn) => void,
  timeout?: number
): void;

/* OK✅ */
interface Example {
  diff(one: string, two?: string, three?: boolean): number;
}

/* OK✅ */
interface Moment {
  utcOffset(): number;
  utcOffset(b: number | string): Moment;
}
~~~

#### 适配不同模块环境

- UMD

  `export as namespace`用于为 UMD（Universal Module Definition）模块声明全局命名空间，允许模块在浏览器或非模块化环境中通过全局变量访问：

  ~~~ts
  export as namespace myLib;
  
  export function myFunction(): void;
  export const myVariable: number;
  ~~~

  - 当 `myLib` 作为模块导入时（如 `import * as myLib from "myLib"`），它可以在模块化环境中使用。
  - 在没有模块系统的环境中（如浏览器中的 `<script>` 标签直接引用），它会将 `myLib` 暴露为一个全局变量，可以直接通过 `myLib.myFunction()` 访问。

- CMJ和AMD

  `export = ` 用于兼容 CommonJS 或 AMD 风格的模块导出方式：

  ~~~ts
  // 在 moduleC.ts 中
  const myFunction = () => { /* ... */ };
  export = myFunction;
  ~~~

### 参考文献

[typescript文档——Declaration Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)

[typescript文档——Library Structures](https://www.typescriptlang.org/docs/handbook/declaration-files/library-structures.html)

[typescript文档——Modules .d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html)

[typescript文档——Module: Plugin](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-plugin-d-ts.html)

[typescript文档——Module: Class](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-class-d-ts.html)

[typescript文档——Module: Function](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-function-d-ts.html)

[typescript文档——Global .d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html)

[typescript文档——Global: Modifying Module](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html)

[typescript文档——Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

[typescript文档——Deep Dive](https://www.typescriptlang.org/docs/handbook/declaration-files/deep-dive.html)

[typescript文档——Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)	

[typescript文档——Consumption](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html)	

