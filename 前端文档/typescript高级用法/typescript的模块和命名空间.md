### 导读

本篇文章属于typescript高级用法合集中的一个小节，typescript高级用法合集中包含了对泛型、声明、模块、命名空间等高级用法的详细解读，非常利于提升typescript使用理解和进阶提升。

[点我去到typescript高级用法合集页~]()

### 模块

typescript的模块实际上就是javascript模块的拓展，**让javascript的模块能够进行typescript类型的导入导出**。也没有更多其他新的功能了。

### 命名空间

命名空间是typescript早期的模块实现方式，它先于es6的模块导入导出语法，并且支持单文件和多文件的命名空间。

#### 单文件命名空间

其实就类似于对象的使用方式，举个例子：

~~~ts
// 命名空间的关键字namespace
// 并且内部的内容想要被外部访问就需要通过关键字export导出
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }
  const lettersRegexp = /^[A-Za-z]+$/;
  const numberRegexp = /^[0-9]+$/;
  export class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string) {
      return lettersRegexp.test(s);
    }
  }
  export class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
      return s.length === 5 && numberRegexp.test(s);
    }
  }
}

let strings = ["Hello", "98052", "101"];

// 从命名空间中拿出内容，类似于对象
let validators: { [s: string]: Validation.StringValidator } = {};
validators["ZIP code"] = new Validation.ZipCodeValidator();
validators["Letters only"] = new Validation.LettersOnlyValidator();

for (let s of strings) {
  for (let name in validators) {
    console.log(
      `"${s}" - ${
        validators[name].isAcceptable(s) ? "matches" : "does not match"
      } ${name}`
    );
  }
}
~~~

甚至命名空间里还可以进行多层嵌套：

~~~ts
namespace Shapes {
   // 一定要通过export导出
  export namespace Polygons {
    export class Triangle {}
    export class Square {}
  }
}
~~~

#### 多文件命名空间

其实就是早期typescript的模块实现方式，不过现在已经逐渐被es6替代了。

~~~ts
// Validation.ts文件

namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }
}
~~~

~~~ts
// LettersOnlyValidator.ts文件

// 命名空间的引入方式（相当于import）：
/// <reference path="Validation.ts" />
namespace Validation {
  const lettersRegexp = /^[A-Za-z]+$/;
  export class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string) {
      return lettersRegexp.test(s);
    }
  }
}
~~~

~~~ts
// ZipCodeValidator.ts文件

/// <reference path="Validation.ts" />
namespace Validation {
  const numberRegexp = /^[0-9]+$/;
  export class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
      return s.length === 5 && numberRegexp.test(s);
    }
  }
}
~~~

~~~ts
// test.ts文件

/// <reference path="Validation.ts" />
/// <reference path="LettersOnlyValidator.ts" />
/// <reference path="ZipCodeValidator.ts" />
// Some samples to try
let strings = ["Hello", "98052", "101"];
// Validators to use
let validators: { [s: string]: Validation.StringValidator } = {};
validators["ZIP code"] = new Validation.ZipCodeValidator();
validators["Letters only"] = new Validation.LettersOnlyValidator();
// Show whether each string passed each validator
for (let s of strings) {
  for (let name in validators) {
    console.log(
      `"${s}" - ${
        validators[name].isAcceptable(s) ? "matches" : "does not match"
      } ${name}`
    );
  }
}
~~~

当我们编译时，typescript会自动读取所有/// \<reference>，并编译对应文件，比如：

~~~sh
tsc test.ts
~~~

它会把Validation.ts、LettersOnlyValidator.ts、ZipCodeValidator.ts都进行编译。

但我们要使用时必须按顺序这些编译好的文件，比如如果是在html中使用，我们必须这样写：

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <script src="./Validation.js"></script>
    <script src="./LettersOnlyValidator.js"></script>
    <script src="./ZipCodeValidator.js"></script>
    <script src="./test.js"></script>
</body>
</html>
~~~

#### 别名

我们可以通过`import`关键字给命名空间添加别名：

~~~ts
namespace Shapes {
  export namespace Polygons {
    export class Triangle {}
    export class Square {}
  }
}
// 通过import关键字添加别名
import polygons = Shapes.Polygons;
let sq = new polygons.Square(); // Same as 'new Shapes.Polygons.Square()'
~~~

此时`import`的作用就类似于`var`，不过`impoart`既可以引入值也可以引入类型；还有一点，修改`import`定义的变量的值并不会更改命名空间中的值，这就类似`require`。

### 模块和命名空间

| 属性     | 模块                                                         | 命名空间                                                     |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 所属范围 | 模块依赖于模块加载器（例如 CommonJs/Require.js）或支持 ES 模块的运行环境。 | 命名空间是 TypeScript 特定的组织代码的方式。                 |
| 定义     | 一种代码拆分的方式，其依赖于相应的环境                       | 命名空间只是全局命名空间中命名的 JavaScript 对象。           |
| 实现方式 | 一般通过环境的编译融合成一个单一的js文件                     | 命名空间是将所有依赖项都作为 `<script>` 标记包含在 HTML 页面中。 |

从命名空间的实现方式就可以看出，命名空间很容易造成全局变量污染。

一些陷阱：

- 使用/// \<reference>引入一个模块

- 无意义的命名空间

  如果我们已经使用模块了，或许没必要在顶层在使用命名空间，比如：

  ~~~ts
  // shapes.ts文件
  // 使用export导出模块
  export namespace Shapes {
    export class Triangle {
      /* ... */
    }
    export class Square {
      /* ... */
    }
  }
  ~~~

  ~~~ts
  // shapeConsumer.ts文件
  
  import * as shapes from "./shapes";
  // 此时就显得很冗余，因为模块在引入时就已经自动生成自己的一块空间（shapes）了
  let t = new shapes.Shapes.Triangle(); // shapes.Shapes?
  ~~~

### 参考文献

[typescript文档——Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

[typescript文档——namespace](https://www.typescriptlang.org/docs/handbook/namespaces.html)

[typescript文档——Namespaces and Modules](https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html)

