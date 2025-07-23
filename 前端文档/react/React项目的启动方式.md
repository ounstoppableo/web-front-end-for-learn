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



