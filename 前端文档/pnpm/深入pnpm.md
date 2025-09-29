### 导读

pnpm是npm的优化解决方案，早期笔者深受npm的毒害：包下载卡死、幻影依赖、版本冲突等等。而pnpm的横空出世，解决了npm的大部分问题。甚至推陈出新，提供了更丰富的包管理功能，比如打补丁、大仓管理等。总而言之pnpm的好处多多，而为了能更好的使用pnpm，理解pnpm的功能、设计思想是很重要的一环，本篇文章将围绕这个主题，去深入剖析pnpm的功能、设计等，帮助读者领会pnpm的强大。

### 深入pnpm

#### npm的不足

npm使用的是**扁平化依赖关系树**（npm3之后）。

简单来说，npm一般会将所有的包都放在首层的`node_modules`中，用来减少磁盘空间占用、长软链接路径问题，比如：

我定义了一个`package.json`，其中依赖如下：

~~~json
"dependencies": {
  "express": "4.18.2",
  "cookie": "1.0.2"
}
~~~

而我们进行`npm i`后，得到如下路径：

![](.\images\Snipaste_2025-08-27_13-33-15.jpg)

可以看到我们的路径下多了很多不不相关的包，这是因为npm将`express`内依赖的包都放到了首层的`node_modules`中了。

我们看看express的`package.json`：

~~~json
 "dependencies": {
    "accepts": "~1.3.8",
    "array-flatten": "1.1.1",
    "body-parser": "1.20.1",
    "content-disposition": "0.5.4",
    "content-type": "~1.0.4",
    "cookie": "0.5.0",
    // ..
  },
~~~

可以看到其中有一个cookie包，而我们自己也有使用到这个包，只是我们使用的是`1.0.2`，而express里的版本为`0.5.0`。

这时候还能平铺吗？显然不能，npm下载的包名字中并没有携带版本，所以平铺的话无法区分，npm使用的是包内`node_modules`去处理这种版本不一致问题，如下图：

![](.\images\Snipaste_2025-08-27_15-02-19.jpg)

![](.\images\Snipaste_2025-08-27_15-02-47.jpg)

具体来讲，npm的包扁平化主要遵循**尽量复用，减少重复**的原则，一共有三种情况：

- 如果顶层声明：

  ~~~
  my-app (lodash@^4.17.0)
  ├─ A -> lodash@^4.17.0
  └─ B -> lodash@^3.10.0
  ~~~

  那么以顶层为主，并且可复用的尽量复用：

  ~~~
  node_modules/
    lodash@4.x
    A/
    B/
    	node_modules/
    	  lodash@3.x
  ~~~

- 如果顶层没声明：

  - 如果多个依赖都能接受同一个版本

    ~~~
    my-app (没声明 lodash)
    ├─ A -> lodash@^3.10.0
    └─ B -> lodash@^3.10.0
    ~~~

    那么复用，将依赖提至顶层：

    ~~~
    node_modules/
      lodash@3.x
      A/
      B/
    ~~~

  - 如果多个依赖相互冲突

    ~~~
    my-app (没声明 lodash)
    ├─ A -> lodash@^3.10.0
    └─ B -> lodash@^4.17.0
    ~~~

    那么无法复用，在各自node_modules中缓存：

    ~~~
    node_modules/
      A/
        node_modules/
          lodash@3.x
      B/
        node_modules/
          lodash@4.x
    ~~~

现在我们弄清楚了npm的包存储模式了，那么这种模式有什么问题呢？

- 包之间缺少隔离。

  比如上面的情况中，我并没有在我的项目`package.json`中使用debug包，但是express依赖了该包，所以平铺在我们的顶层`node_modules`了，在项目中我们就可以正常引用了，但是这是正常行为吗？如果debug包被一个待删除的包引用了，而我也确实需要debug包，但是没在`package.json`中引入就直接使用了，等这个包被删除后，debug不就用不了了吗？有的读者会说，这是小问题啊，再下回来不就行了？但问题是如果版本不兼容呢？如果这个问题出在多个包上呢？可见这是个严肃的问题，我们一般称这种为**幻影依赖**，我明明没声明，怎么就能用了？

针对以上情况pnpm做了优化，并且下载更快！磁盘占用更小！为了知道pnpm做了哪些优化，请读者继续阅读下面内容。

#### pnpm的存储

##### 存储结构优化

首先，pnpm也使用了扁平化处理，但是是在`.pnpm`文件中，我们看一个案例：

假设你安装了依赖于 `bar@1.0.0` 的 `foo@1.0.0`，那么会经历以下几个过程：

- 安装相关依赖

  ~~~
  node_modules
  └── .pnpm
      ├── bar@1.0.0
      │   └── node_modules
      │       └── bar
      │           ├── index.js     -> <store>/001
      │           └── package.json -> <store>/002
      └── foo@1.0.0
          └── node_modules
              └── foo
                  ├── index.js     -> <store>/003
                  └── package.json -> <store>/004
  ~~~

  我们发现包的嵌套很奇怪，比如`bar@1.0.0`它的真实文件居然是在`node_modules/.pnpm/bar@1.0.0/node_modules/bar`下，为什么要这样设计呢？主要是允许包能引入自己。

  所以我们可以总结，pnpm的`.pnpm`结构有两个好处：

  - **允许包自行导入自己**。比如 foo 应该能够 `require('foo/package.json')` 或者 `import * as package from "foo/package.json"`。这是一个很正常的行为，也就是一个包内的某个文件需要使用包内另一个文件的内容时。
  - **避免循环符号连接**。扁平化处理的优势。

- 符号连接依赖项

  安装了相关依赖后，此时还不能体现 `foo@1.0.0`依赖于`bar@1.0.0`，而这个阶段就是为了实现这个功能：

  ~~~
  node_modules
  └── .pnpm
      ├── bar@1.0.0
      │   └── node_modules
      │       └── bar -> <store>
      └── foo@1.0.0
          └── node_modules
              ├── foo -> <store>
              └── bar -> ../../bar@1.0.0/node_modules/bar
  ~~~

  首先我们在`foo@1.0.0`中创建了关于`bar@1.0.0`的符号链接，然后：

  ~~~
  node_modules
  ├── foo -> ./.pnpm/foo@1.0.0/node_modules/foo
  └── .pnpm
      ├── bar@1.0.0
      │   └── node_modules
      │       └── bar -> <store>
      └── foo@1.0.0
          └── node_modules
              ├── foo -> <store>
              └── bar -> ../../bar@1.0.0/node_modules/bar
  ~~~

  我们将顶层`package.json`声明的直接依赖放到顶层`node_modules`中。

以上就是pnpm添加包的过程，非常的easy。下面我们假设有一个`qar@2.0.0`包同时被`bar@1.0.0`和`foo@1.0.0`依赖：

~~~
node_modules
├── foo -> ./.pnpm/foo@1.0.0/node_modules/foo
└── .pnpm
    ├── bar@1.0.0
    │   └── node_modules
    │       ├── bar -> <store>
    │       └── qar -> ../../qar@2.0.0/node_modules/qar
    ├── foo@1.0.0
    │   └── node_modules
    │       ├── foo -> <store>
    │       ├── bar -> ../../bar@1.0.0/node_modules/bar
    │       └── qar -> ../../qar@2.0.0/node_modules/qar
    └── qar@2.0.0
        └── node_modules
            └── qar -> <store>
~~~

我们以之前举得`express`为例，看看pnpm包实际在文件中的结构：

~~~
"dependencies": {
  "express": "4.18.2",
  "cookie": "1.0.2"
}
~~~

![](.\images\Snipaste_2025-08-28_10-02-17.jpg)

可以看到我们顶层的`node_modules`非常干净，解决了**幻影依赖**问题。

> 而且其实顶层`node_modules`的cookie和express包都是符号链接，链接到`.pnpm`内的真实文件，但不知道为什么vscode没有标识。

下面我们看看`.pnpm`：

![](.\images\Snipaste_2025-08-28_10-03-37.jpg)

就是常规的平铺。

![](.\images\Snipaste_2025-08-28_10-04-22.jpg)

可以看到express的`node_modules`下都是符号链接。

##### 存储方式优化

除了以上关于包结构的优化之外，pnpm还做了关于**存储方式的优化**：

> Why more efficient? When you install a package, we keep it in a global store on your machine, then we create a hard link from it instead of copying. For each version of a module, there is only ever one copy kept on disk. When using npm or yarn for example, if you have 100 packages using lodash, you will have 100 copies of lodash on disk. *Pnpm allows you to save gigabytes of disk space!*

上面的意思是pnpm将不同项目中使用到的相同的包（版本也必须相同）都存储在了一个全局仓库中，一旦进行安装，将使用**硬链接**的方式，不仅存储只存储了全局仓库中的一份，**减少了存储空间**，而且从本地**硬链接**包也显著的**提升了安装速度**。

>硬链接：文件可以在不同目录下，但指向的都是同一个文件，也就是有多个入口，从而节省磁盘空间。

我们来看看实际案例：

![](.\images\Snipaste_2025-08-28_10-18-36.jpg)

我们准备了两个项目，他们有相同的`package.json`：

~~~
"dependencies": {
  "express": "4.18.2",
  "cookie": "1.0.2"
}
~~~

下面我们来查看其在`.pnpm`中的真实`express`包的文件：

![](.\images\Snipaste_2025-08-28_10-23-44.jpg)

可以看到express下的`History.md`文件有三个入口，但只存储在appData中一份，这就是所谓硬链接。

#### 对等依赖的处理

所谓对等依赖（peeer）就是**相同包的不同版本**。比如：

~~~
- parent-1
  - baz@1.0.0
- parent-2
  - baz@1.1.0
~~~

此时我们的存储结构是怎么样的呢？

~~~
node_modules
└── .pnpm
    ├── parent-1
    │   └── node_modules
    │       ├── parent-1
    │       └── baz   -> ../../baz@1.0.0/node_modules/baz
    ├── parent-2
    │   └── node_modules
    │       ├── parent-2
    │       └── baz   -> ../../baz@1.1.0/node_modules/baz
    ├── baz@1.0.0
    ├── baz@1.1.0
~~~

如果再嵌套多层也是同样：

~~~
node_modules
└── .pnpm
    ├── a@1.0.0_c@1.0.0
    │   └── node_modules
    │       ├── a
    │       └── b -> ../../b@1.0.0_c@1.0.0/node_modules/b
    ├── a@1.0.0_c@1.1.0
    │   └── node_modules
    │       ├── a
    │       └── b -> ../../b@1.0.0_c@1.1.0/node_modules/b
    ├── b@1.0.0_c@1.0.0
    │   └── node_modules
    │       ├── b
    │       └── c -> ../../c@1.0.0/node_modules/c
    ├── b@1.0.0_c@1.1.0
    │   └── node_modules
    │       ├── b
    │       └── c -> ../../c@1.1.0/node_modules/c
    ├── c@1.0.0
    ├── c@1.1.0
~~~

总结下来就一句话，**将所有对等依赖平铺到`.pnpm`中，然后使用软链接**。

由于pnpm不像是npm那样在`node_modules`中进行平铺，所以即使平铺也不会造成**幻影依赖**。在npm中，我们知道当不存在复用条件时，会使用嵌套结构，所以某种小概率情况下，npm还是存在长路径问题，但是pnpm完全解决了这个问题。

#### pnpm的高级用法

##### 打补丁

打补丁功能是**提供给使用者自定化包的能力**。比如我们从npm库下载了一个包，但是这个包不是完全满足我们的需求，我们对其进行修改后，为了让其修改在之后的`pnpm i`不会丢失，我们一般就会使用打补丁功能。

用法如下：

比如我们针对前面npmDemo的例子，对cookie包做一些修改：

![](.\images\Snipaste_2025-08-28_11-08-01.jpg)

![](.\images\Snipaste_2025-08-28_11-09-29.jpg)

下面我们对这个修改进行保存：

- 首先将cookie包添加到工作区

  ![](.\images\Snipaste_2025-08-28_11-11-04.jpg)

  此时我们看到目录结构多了一个文件夹：

  ![](.\images\Snipaste_2025-08-28_11-12-38.jpg)

  我们只要将修改的内容复制到这个文件夹下对应的位置，也就是`index.js`中即可。

- 提交修改

  修改完后还需要提交修改：

  ~~~sh
  pnpm patch-commit <path> # path精确到包而不是具体文件，不然修改一百个文件还要一个一个commit得累死
  ~~~

  ![](.\images\Snipaste_2025-08-28_11-16-43.jpg)

  ![](.\images\Snipaste_2025-08-28_11-18-33.jpg)

到这里我们就完成了一次打补丁，具体pnpm是如何在我们重新`pnpm i`后还能应用该补丁呢？主要是依靠`pnpm-workspace.yaml`文件：

![](.\images\Snipaste_2025-08-28_11-20-19.jpg)

所以我们已知的**不可变文件**的有：

- patches文件夹
- `pnpm-workspace.yaml`

只要有这两个文件我们就能**定位并使用**补丁。

删除补丁也很简单只要：

~~~sh
pnpm patch-remove cookie@0.5.0 # patchedDependencies内的key
~~~

##### 工作空间

工作空间是pnpm提供的用于支持monorepo的功能，是一个高级功能。

> **Monorepo**（Mono Repository）指的是 **将多个相关项目/包放在同一个代码仓库里管理**，而不是每个项目单独一个仓库（Polyrepo），这样可以统一进行版本管理、统一依赖管理、统一CI/CD。

一个工作空间中，最核心的就是`pnpm-workspace.yaml`文件，这个文件在打补丁中出现过，不过它的功能远不止打补丁。

假设我们有这样一个monorepo仓库：

![](.\images\Snipaste_2025-08-28_16-47-15.jpg)

此时的大仓里有**a**和**b**两个小仓，我们如下配置`pnpm-workspace.yaml`：

~~~yaml
packages:
  - 'packages/*'
~~~

即可生成一个pnpm大仓。

###### 统一依赖管理

那么大仓有哪些功能呢？首先我们就先介绍**统一的依赖管理**吧，在monorepo的目录下执行`pnpm i`后：

![](.\images\Snipaste_2025-08-28_16-51-54.jpg)

我们就可以统一安装依赖了，现在安装依赖有两种：

- **全局安装**，只需要在monorepo文件夹下执行`pnpm i packageName`即可，该操作会在monorepo的`node_modules`中下载包，子包可以通过`node_modules`的逐层读取规则获取到全局包。

- **局部安装**，局部安装一般用于子包有自己需要的依赖或者版本不同的依赖，只需要执行`pnpm add lodash --filter a`，表示在a包中安装lodash：

  ![](.\images\Snipaste_2025-08-28_16-57-35.jpg)

在工作区间中，所有子包都是通过符号链接引用资源的，其资源都下载在根目录的`node_modules`的`.pnpm`中：

![](.\images\Snipaste_2025-08-28_16-59-20.jpg)

这极大提升了复用率，减少磁盘消耗。前面我们也讲过，遇到版本不同的问题名称加个版本号平铺就完事了。

**Catalog目录协议**

pnpm还提供了一个**统一的包版本管理协议Catalog**，具体用法如下：

~~~yaml
# pnpm-workspace.yaml文件
packages:
  - packages/*

# 定义目录和依赖版本号
catalog:
  react: ^18.3.1
  redux: ^5.0.1
~~~

~~~json
// packages/example-app/package.json
{
  "name": "example-app",
  "dependencies": {
    "react": "catalog:",
    "redux": "catalog:"
  }
}
~~~

这等于直接写入一个版本范围：

~~~json
{
  "name": "@example/app",
  "dependencies": {
    "react": "^18.3.1",
    "redux": "^5.0.1"
  }
}
~~~

其优势如下：

- **维护唯一版本** - 我们通常希望在工作空间中共同的依赖项版本一致。 Catalog 让工作区内共同依赖项的版本更容易维护。 重复的依赖关系可能会在运行时冲突并导致错误。 当使用打包器时，不同版本的重复依赖项也会增大项目体积。
- **易于更新** — 升级或者更新依赖项版本时，只需编辑 `pnpm-workspace.yaml` 中的目录，而不需要更改所有用到该依赖项的 `package.json` 文件。 这样可以节省时间 — 只需更改一行，而不是多行。
- **减少合并冲突** — 由于在升级依赖项时不需要编辑 `package.json`文件，所以这些依赖项版本更新时就不会发生 git 冲突。

###### 包间依赖

上一小节我们讲了统一依赖管理，每个包之间是隔离的。但是一般情况下，我们使用monorepo都是为了解决微前端的仓库管理问题，所以少不了包之间的相互依赖（这里的包间依赖指的是**a**包将**b**包作为依赖这种情况，并不是**a**包依赖**b**包的依赖，这个完全可以通过`pnpm i packageName`解决）。而pnpm当然也支持这些功能。

**工作空间协议**

工作空间协议（workspace:）受`pnpm-workspace.yaml`中的`linkWorkspacePackages`配置影响，`linkWorkspacePackages`有三个值：

- **false**

  **a**包会使用**b**包在npm registry上发布的版本，而不是本地源码

- **true**

  **a**包会直接符号链接到本地**b**包（即使用源码版本），只会处理顶层，不会处理**b**包的依赖项

- **deep**

  假设**a**包依赖的**b**包的子依赖项也链接了本地packages中的某个包，那么也会软链接到本地包

**工作空间协议**只在`linkWorkspacePackages`不为**false**的时候工作。首先工作空间协议体现在`package.json`中：

~~~json
"dependencies": {
    "foo"："workspace:*"
}
// 这表示如果我们在该环境下import * from foo; 会链接到本地的foo
~~~

~~~json
"dependencies": {
 	"bar": "workspace:foo@*"
}
// 这表示如果我们在该环境下import * from bar; 会链接到本地的foo
~~~

当我们需要单独给包发版时，**工作空间协议**语法也可以被正常转换：

~~~json
{
	"dependencies": {
		"foo": "workspace:*",
		"bar": "workspace:~",
		"qar": "workspace:^",
		"zoo": "workspace:^1.5.0"
	}
}
~~~

执行`pnpm pack`或 `pnpm publish`：

~~~json
{
	"dependencies": {
		"foo": "1.5.0",
		"bar": "~1.5.0",
		"qar": "^1.5.0",
		"zoo": "^1.5.0"
	}
}
~~~

这样每个包都可以单独发版使用。

看到这里，有的读者可能会有疑惑，这里的版本、名称到底是怎么确定的？是按照文件名吗？如果按照文件名，其不确定性就太大了，**pnpm实际上是根据`package.json`来确定版本和名称**的：

~~~json
{
  "name": "a",  // 名称
  "version": "1.0.0",  // 版本
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "packageManager": "pnpm@10.13.1",
  "dependencies": {
    "lodash": "^4.17.21",
    "react": "^19.1.1"
  }
}
~~~

能确定名称和版本之后，我们就可以使用工作空间协议来按版本引入需要的包了，下面是一个实践案例：

假设我们有一个这样的文件结构：

![](.\images\Snipaste_2025-08-29_08-40-10.jpg)

a@1.0.0和a@2.0.0的`package.json`分别为：

~~~json
{
  "name": "a", // 名称
  "version": "1.0.0", // 版本
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "packageManager": "pnpm@10.13.1",
  "dependencies": {
    "lodash": "^4.17.21",
    "react": "^19.1.1"
  }
}
~~~

~~~json
{
  "name": "a", // 名称
  "version": "2.0.0", // 版本
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "packageManager": "pnpm@10.13.1",
  "dependencies": {
    "lodash": "^4.17.21",
    "react": "^19.1.1"
  }
}
~~~

a@1.0.0和a@2.0.0的`index.js`分别为：

~~~js
const fn = () => {
  console.log("This is package a version 1.0.0");
};
module.exports = { fn };
~~~

~~~js
const fn = () => {
  console.log("This is package a version 2.0.0");
};
module.exports = { fn };
~~~

b的`package.json`为：

~~~json
{
  "name": "b",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "packageManager": "pnpm@10.13.1",
  "dependencies": {
    "vue": "^3.5.20",
    "a": "workspace:1.0.0" // 指定引入a@1.0.0版本
  }
}
~~~

为了要使用工作空间以及工作空间协议，我们需要配置`pnpm-workspace.yaml`：

~~~yaml
packages:
  - "packages/*"

linkWorkspacePackages: true
~~~

现在前置条件都弄好了，我们到b中引用一下a包吧：

~~~sh
cd ./b
pnpm i # 将a包安装到b内
~~~

![](.\images\Snipaste_2025-08-29_08-49-59.jpg)

诶？？怎么我指定的是a@1.0.0，下载的却是a@2.0.0？，官网中给出了答案：

> workspace 中的包版本管理是一个复杂的任务，pnpm 目前也并未提供内置的解决方案。 不过，有两个不错且支持 pnpm 的版本控制工具可以使用：
>
> - [changesets](https://github.com/changesets/changesets)
> - [Rush](https://rushjs.io/)
>
> 有关如何使用 Rush 设置存储库，请阅读 [此页面](https://rushjs.io/pages/maintainer/setup_new_repo)。
>
> 要使用 pnpm 的变更集，请阅读[本指南](https://pnpm.io/zh/using-changesets)。

> **注意**：这里的未解决的包版本管理指的是**workspace中引用本地包的版本管理问题**，如果是远程包是能正确获取版本的。

所以，很遗憾，pnpm并没有提供包版本管理的能力，但是我们还是将流程走完吧：

b的`index.js`文件中：

~~~js
const a = require("a");
a.fn();
~~~

~~~sh
node index.js
~~~

![](.\images\Snipaste_2025-08-29_08-51-57.jpg)

可以看到这里我们成功的引用了本地包。

### 参考文献

[工作空间（Workspace）](https://pnpm.io/zh/workspaces)

[基于符号链接的 node_modules 结构](https://pnpm.io/zh/symlinked-node-modules-structure)

[对等依赖 (peers) 是如何被处理的](https://pnpm.io/zh/how-peers-are-resolved)

[pnpm vs npm](https://pnpm.io/zh/pnpm-vs-npm)

[Settings (pnpm-workspace.yaml)](https://pnpm.io/zh/settings)

[平铺的结构不是 node_modules 的唯一实现方式](https://pnpm.io/zh/blog/2020/05/27/flat-node-modules-is-not-the-only-way)

[Why should we use pnpm?](https://www.kochan.io/nodejs/why-should-we-use-pnpm.html)

[pnpm's strictness helps to avoid silly bugs](https://www.kochan.io/nodejs/pnpms-strictness-helps-to-avoid-silly-bugs.html)

[Catalogs](https://pnpm.io/zh/catalogs)