### 导读

本篇文章属于typescript高级用法合集中的一个小节，typescript高级用法合集中包含了对泛型、声明、模块、命名空间等高级用法的详细解读，非常利于提升typescript使用理解和进阶提升。

[点我去到typescript高级用法合集页~]()

### tsconfig.json是什么？

目录中存在 `tsconfig.json` 文件表示该目录是 TypeScript 项目的根目录。 `tsconfig.json` 文件指定编译项目所需的根文件和编译器选项。

### tsconfig.json结构

- 顶层

  - `files`：指定要包含在程序中的文件的允许列表。其会覆盖`include`和`exclude`。一般用于调试阶段，仅编译和测试少量关键文件时，可以使用 `files` 来避免编译整个项目，从而节省时间。
  - `compilerOptions`：该选项构成了 TypeScript 配置的大部分，并且涵盖了语言应该如何工作。
  - `extends`：值是一个字符串，其中包含要继承的另一个配置文件的路径。除了`references`的其他配置项都将被继承。
  - `include`：指定要包含在程序中的文件名或正则的数组。这些文件名是相对于包含 `tsconfig.json` 文件的目录进行解析的。
  - `exclude`：指定解析 `include` 时应跳过的文件名或正则数组。
  - `references`：将 TypeScript 程序构建为更小的片段的一种方法。使用`references`可以极大地缩短构建和编辑器交互时间，强制组件之间的逻辑分离，并以新的和改进的方式组织代码。

- `compilerOptions`

  - **类型检查设置**

    ~~~ts
    allowUnreachableCode,allowUnusedLabels,alwaysStrict,exactOptionalPropertyTypes,noFallthroughCasesInSwitch,noImplicitAny,noImplicitOverride,noImplicitReturns,noImplicitThis,noPropertyAccessFromIndexSignature,noUncheckedIndexedAccess,noUnusedLocals,noUnusedParameters,strict,strictBindCallApply,strictBuiltinIteratorReturn,strictFunctionTypes,strictNullChecks,strictPropertyInitialization anduseUnknownInCatchVariables
    ~~~

  - **模块设置**：用于控制各种模块引入的语法检查，比如支持任意拓展(allowArbitraryExtensions)：

    ~~~ts
    // app.d.css.ts
    declare const css: {
      cookieBanner: string;
    };
    export default css;
    ~~~

    ~~~ts
    // App.tsx
    // 支持css拓展的模块引入
    import styles from "./app.css";
    styles.cookieBanner; // string
    ~~~

    ~~~
    allowArbitraryExtensions,allowImportingTsExtensions,allowUmdGlobalAccess,baseUrl,customConditions,module,moduleResolution,moduleSuffixes,noResolve,noUncheckedSideEffectImports,paths,resolveJsonModule,resolvePackageJsonExports,resolvePackageJsonImports,rootDir,rootDirs,typeRoots andtypes
    ~~~

  - Emit设置：指定编译后文件的输出规则

  - js支持

  - 编辑支持：拓展功能支持

  - 互操作约束：制定一系列关于ES的语法识别规则

  - 向后兼容性：一些版本适配规则

  - 语言和环境：设置一些语法支持，比如装饰器、JSX

  - 编译器诊断：设置typescript诊断规则

  - projects：设置项目相关配置

  - 输出格式：设置错误提示格式

  - 完整性：设置检查范围

  - 命令行

  - watch选项：监视目录控制

- `reference`

  是一种模块化构建的实现方案。

  假设有一个项目 `app`，它依赖于项目 `library`，可以这样配置 `app` 项目的 `tsconfig.json`：

  ~~~json
  // app/tsconfig.json
  {
    "compilerOptions": {
      "composite": true, // 必须启用以支持项目引用
      "outDir": "./dist"
    },
    "references": [
      { "path": "../library" }
    ]
  }
  
  ~~~

  在 `library` 项目中也需要配置 `tsconfig.json`，并启用 `composite` 选项：

  ~~~json
  // library/tsconfig.json
  {
    "compilerOptions": {
      "composite": true, // 必须启用以支持项目引用
      "outDir": "./dist"
    }
  }
  ~~~

  执行`tsc --build`后typescript会根据 `references` 属性的依赖关系来决定构建顺序，确保项目之间的依赖关系正确。

### CLI 映射

tsc构建选项及含义：

- --build：构建一个或多个项目及其依赖项
- --clean：删除所有项目的输出
- --dry：显示将构建的内容
- --force：构建所有项目，包括那些看起来是最新的项目

### 参考文献

[What is a tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

[Compiler Options in MSBuild](https://www.typescriptlang.org/docs/handbook/compiler-options-in-msbuild.html)

[Intro to the TSConfig Reference](https://www.typescriptlang.org/tsconfig/#)

[tsc CLI Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

[Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
