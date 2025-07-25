### 导读

本篇文章是属于[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)合集的一个章节，[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)帮助读者剖析react源码，从fiber节点、lane调度优先级控制、微任务调度、虚拟dom更新机制、常见hooks源码解析等，帮助读者理解react设计架构与优化机制，让react的进阶不再困难，让前端能力的提升没有瓶颈。

### React项目的启动方式

#### 获取React源码

去到[react源码git仓库](https://github.com/facebook/react.git)clone项目到本地。

~~~sh
git clone https://github.com/facebook/react.git
~~~

#### 进入项目并安装依赖

> **注意**
>
> 下面是一些前置条件：
>
> - 您已安装 [Node](https://nodejs.org/)的LTS版本并且[Yarn](https://yarnpkg.com/en/)为v1.2.0+
>
> - 您已安装JDK
>
>   可参考[Java 开发环境配置](https://www.runoob.com/java/java-environment-setup.html)
>
> - 您已经安装了 `gcc`以及node跨平台编译器 （node-gyp）。我们的某些依赖项可能需要一个汇编步骤。在OS X上，XCode命令行工具将涵盖此信息。在Ubuntu上， `apt-get install build-essential` 将安装所需的软件包。类似的命令应在其他Linux发行版上使用。 Windows将需要一些其他步骤，请参阅[`node-gyp`](https://github.com/nodejs/node-gyp#installation) 安装说明以获取详细信息
>
> 下面是笔者的环境：
>
> ~~~ts
> node - v22.17.1
> python - v3.13.0
> java - 21.0.7 2025-04-15 LTS
> yarn - v1.22.22
> visual studio - 2019 勾选 使用C++的桌面开发
> node-gyp - v11.2.0
> ~~~

~~~sh
cd ./react
yarn
~~~

#### 构建项目

~~~sh
yarn build
~~~

等了很长一段时间后，终端出现了以下文字：

~~~
mkdir -p ./compiler/packages/babel-plugin-react-compiler/dist && echo "module.exports = require('../src/index.ts');" > ./compiler/packages/babel-plugin-react-compiler/dist/index.js
 
命令错误
~~~

心脏骤停😱😱😱

怎么解决呢？

找到`/react/scripts/rollup/bundles.js`，将：

~~~ts
prebuild: `mkdir -p ./compiler/packages/babel-plugin-react-compiler/dist && echo "module.exports = require('../src/index.ts');" > ./compiler/packages/babel-plugin-react-compiler/dist/index.js`,
~~~

修改成：

~~~ts
prebuild: `node -e "const fs = require('fs'); const path = require('path'); const dir = path.resolve(__dirname, '../compiler/packages/babel-plugin-react-compiler/dist'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports = require(\\'../src/index.ts\\');');"`,
~~~

> 有的解决方法说是利用git bash，这样就能执行mkdir（linux指令，window执行不了）指令了，但是笔者测过没什么效果。

接下来又是一阵漫长的等待...

![](.\images\Snipaste_2025-07-24_08-45-49.jpg)

构建了40分钟...

构建完后，我们的工作目录是这样的：

![](.\images\Snipaste_2025-07-23_16-30-56.jpg)

#### 项目启动

进入`/react/fixtures/dom/`。

利用git bash执行（因为有用到cp指令）：

~~~sh
yarn
yarn dev
~~~

启动之后打开这个界面就是成功了：

![](.\images\Snipaste_2025-07-24_08-17-58.jpg)

#### 如何按需构建

我们在`/react/fixtures/dom/src/index.js`文件下可观察到使用了`createRoot`方法，那么我们在`createRoot`源码里埋个点：

~~~ts
// react/packages/react-dom/src/client/ReactDOMRoot.js

export function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  // ...
  console.log('这是我在源码对createRoot进行的埋点~');  // 添加这行代码
  // ...
}
~~~

~~~sh
yarn build react-dom
~~~

这个指令的意思是单独构建`react-dom`模块，因为我们修改的`createRoot`就是在`react-dom`模块。

其他可构建模块可以参考`react/scripts/rollup/bundles.js`，里面定义了各种可构建模块，比如我们刚刚构建的`react-dom`：

~~~ts
{
  bundleTypes: [NODE_DEV, NODE_PROD],
  moduleType: RENDERER,
  entry: 'react-dom',
  global: 'ReactDOM',
  minifyWithProdErrorCodes: true,
  wrapWithModuleBoundaries: true,
  externals: ['react'],
},
~~~

虽说是按需构建，但是等待时间也是挺久的，下面就是漫长的等待~~

![](.\images\Snipaste_2025-07-24_08-43-24.jpg)

构建了差不多十分钟，目前笔者也没有看到更好的构建方法了，这个可能需要读者自己去探索。

构建好后，我们的文件目录是这样：

![](.\images\Snipaste_2025-07-24_08-44-32.jpg)

和之前全量构建一样，现在我们只需要到`/react/fixtures/dom/`下重新执行：

~~~sh
yarn dev
~~~

结果就是我们的代码成功被执行了!!!

![](.\images\Snipaste_2025-07-24_08-47-43.jpg)

### 参考文献

[How to Contribute](https://legacy.reactjs.org/docs/how-to-contribute.html)
