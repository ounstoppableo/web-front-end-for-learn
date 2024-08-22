### 导读

自动化测试在近些年逐渐火热，再加上前端框架的支持，基本上一个优质的项目都离不开自动化测试环境的部署。而目前最为火热的自动化测试框架就是jest，所以本文也将围绕jest来探讨前端的自动化测试部署。了解过jest的朋友可能知道，jest只支持原生js语言的测试，也就是说ts、vue这些文件jest实际上是解析不了的，而本篇文章的目的就是教给读者如何去部署并使用在vue环境下的自动化测试环境~~

为了让读者理解我们需要的每一个包的含义，我会以渐进式（增量式）的方式去进行包的引入😘

### 配置

#### 最简基础配置

首先基于jest的自动化测试框架，那么jest包的下载显然是必不可少的：

~~~sh
npm i -D jest
~~~

安装了jest之后，实际上我们就可以通过以下指令启动了：

~~~sh
jest
~~~

但是这样使用的是没有任何配置的jest，我们需要jest有更丰富的功能，比如我们需要测试的环境可能不只是js环境，可能还包括dom环境，也就是我们需要有一个拥有document这个对象的环境，而如果我们的js不是在浏览器运行的一般是不会有这个环境的；比如我们需要对ts、vue这些文件进行编译成js语言，这样jest才能对其测试。。。总而言之，仅仅使用裸的jest是没用的，于是我们要配置jest.config.js：

~~~js
// jest.config.cjs文件
module.exports = {
    // 配置我们将要测试的路径
    roots: ['<rootDir>/src'],
    // 配置我们要执行的测试文件
    testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{vue,js,ts,tsx,jsx}',
                '<rootDir>/src/**/*.{spec,test}.{vue,js,ts,tsx,jsx}'
               ],
    // 以上两个结合起来就是：jest将在root下找到匹配testMatch的文件并执行
    
    // 配置测试执行环境，jsdom表示会提供一个模拟的document对象，需要安装jest-environment-jsdom包
    testEnvironment: 'jsdom',
    // 当你引入模块（require或import）时，没有写拓展名，通过配置这个会自动补全，jest会按顺序尝试补全
    moduleFileExtensions: ['vue','js','jsx','ts','tsx','json','node'],
    // 每次执行jest指令都会重置mock
    resetMocks:true,
}
~~~

配置完上面的选项，我们就可以拥有一个丰富的原生jest测试配置了，但是还是不能解析vue、ts等文件，因为jest并没有提供解析这些文件的功能，所以我们需要引入第三方包：

~~~sh
# 这个包用于编译vue文件，使其能被jest识别
npm i -D @vue/vue3-jest
~~~

这个包可能存在版本问题，不同版本需要下载的包不同，我这个是对应jest@27的版本，详情还请参考[vue-jest的文档](https://github.com/vuejs/vue-jest)。

下载之后就继续配置jest.config.js：

~~~js
// jest.config.cjs文件
module.exports = {
    roots: ['<rootDir>/src'],
    testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{vue,js,ts,tsx,jsx}',
                '<rootDir>/src/**/*.{spec,test}.{vue,js,ts,tsx,jsx}'
               ],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['vue','js','jsx','ts','tsx','json','node'],
    resetMocks:true,
    
    // transform就表示如果遇到匹配正则的路径，就利用给出的包进行编译
    transform:{
        '^.+\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest'
    },
    // 设置不需要transform的路径，一般会设置node_modules，但是也视情况而定
    // 如果你的node_modules里也有非原生js文件，并且还会被被测试文件引入，那么就不能忽略转换
    transformIgnorePatterns:[],
}
~~~

配置完vue的文件解析之后，就结束了吗？实际上还有一个问题，那就是jest不支持es6模块的解析，只能解析cjs的模块解析，换句话说，被检测的文件只能通过require进行模块的引入，那这就很难办，我们写项目一般都用import，谁用require？实际上[jest提供了一个测试性es6模块引入的方法](https://jest-archive-august-2023.netlify.app/zh-Hans/docs/27.x/ecmascript-modules)，但是我感觉好像没什么用，也可能是我配置的有问题，感兴趣的读者可以去试试。

解决es6模块引入问题，我们最常用的就是babel了，实际上webpack、vite项目解决这个问题用的都是babel，而babel也很给力，出了个包兼容jest：

~~~sh
npm i -D babel-jest @babel/core @babel/preset-env
~~~

babel我们需要配置两个地方：

- 一般es6模块文件走babel解析：

  ~~~js
  // jest.config.cjs文件
  module.exports = {
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{vue,js,ts,tsx,jsx}',
                  '<rootDir>/src/**/*.{spec,test}.{vue,js,ts,tsx,jsx}'
                 ],
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['vue','js','jsx','ts','tsx','json','node'],
      resetMocks:true,
      
      // transform就表示如果遇到匹配正则的路径，就利用给出的包进行编译
      transform:{
          '^.+\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest',
          '^.+\\.(js|jsx|ts|tsx|mjs|cjs)$': '<rootDir>/node_modules/babel-jest',
      },
      transformIgnorePatterns:[],
  }
  ~~~

- 虽然文件走babel-jest解析了，但是如果当前项目环境没有配置babel环境也是不起效果的，就比如你抽象了一个接口，虽然调用了，但是内部没有具体实现，所以不起作用，所以我们还需要安装babel环境：

  ~~~js
  // babel.config.cjs文件
  module.exports = {
      presets: [
          [
              '@babel/preset-env',
              {
                  targets: {
                      node: 'current'
                  },
              }
          ]
      ]
  }
  ~~~

这样配置后jest就可以解析es6模块了。

对于上面的配置，其实已经可以使用于一般的vue项目了，即使你的vue中使用的是ts语言，但如果是vue文件，那么就能被@vue/vue3-jest解析。

但是有的项目可能还需要解析ts，而解析ts有两个方法：

- 使用ts-jest

  ~~~sh
  npm i -D ts-jest
  ~~~

  ~~~js
  // jest.config.cjs文件
  module.exports = {
      // 配置之后就能解析ts文件了
      preset: 'ts-jest',
      
      roots: ['<rootDir>/src'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{vue,js,ts,tsx,jsx}',
                  '<rootDir>/src/**/*.{spec,test}.{vue,js,ts,tsx,jsx}'
                 ],
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['vue','js','jsx','ts','tsx','json','node'],
      resetMocks:true,
      transform:{
          '^.+\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest',
          '^.+\\.(js|jsx|ts|tsx|mjs|cjs)$': '<rootDir>/node_modules/babel-jest',
      },
      transformIgnorePatterns:[],
  }
  ~~~

- 继续使用babel

  ~~~sh
  npm i -D @babel/preset-typescript
  ~~~

  ~~~js
  // babel.config.cjs文件
  module.exports = {
      presets: [
          [
              '@babel/preset-env',
              {
                  targets: {
                      node: 'current'
                  },
              }
          ],
          '@babel/preset-typescript'
      ]
  }
  ~~~

两个方法二选一即可。

到这里，我们的基本vue测试环境就算配置完成了。😘😘😘

***整合配置***：

~~~sh
npm i -D jest jest-environment-jsdom @vue/vue3-jest babel-jest @babel/core @babel/preset-env ts-jest @babel/preset-typescript
~~~

~~~js
// jest.config.cjs文件
module.exports = {
    preset: 'ts-jest',
    roots: ['<rootDir>/src'],
    testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{vue,js,ts,tsx,jsx}',
        '<rootDir>/src/**/*.{spec,test}.{vue,js,ts,tsx,jsx}'
    ],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['vue', 'js', 'jsx', 'ts', 'tsx', 'json', 'node'],
    resetMocks: true,
    transform: {
        '^.+\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest',
        '^.+\\.(js|jsx|ts|tsx|mjs|cjs)$': '<rootDir>/node_modules/babel-jest',
    },
    transformIgnorePatterns: [],
}
~~~

我们将其应用于`启动中`：

~~~sh
# --watch表示启动一个类似服务器的功能，可以hmr监听文件变化，每次变化都会再触发测试
jest --config='./jest.config.cjs' --watch
~~~

#### 增量配置及其含义

虽然上面的配置可以满足我们的一般测试环境了，但是有时候我们还不能仅仅满足于此，比如说我们要考虑到项目中可能存在一些不好的模块引入（用了别名、引入了css和图片等不能被jest解析的文件），或者我们想用一些全局设置等，接下来我们就来一一增量。

##### 处理不好的模块引入

~~~js
// jest.config.cjs文件
module.exports = {
    roots: ['<rootDir>/src'],
    testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{vue,js,ts,tsx,jsx}',
                '<rootDir>/src/**/*.{spec,test}.{vue,js,ts,tsx,jsx}'
               ],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['vue','js','jsx','ts','tsx','json','node'],
    resetMocks:true,
    transform:{
        '^.+\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest',
        '^.+\\.(js|jsx|ts|tsx|mjs|cjs)$': '<rootDir>/node_modules/babel-jest',
    },
    transformIgnorePatterns:[],
    
    // 我们一般会使用该属性来进行坏模块引入处理，其处理逻辑就是会匹配到require或import（需要配babel）的路径，然后进行转换
    moduleNameMapper: {
        // 处理以@/*等形式的路径别名情况，具体可根据自己项目的情况设置
        '^@/(.*)': '<rootDir>/src/$1',
        '\\.(jpg|png|jpeg|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/__mocks__/fileMock.js',
        '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js'
        // fileMock.js和styleMock.js需要自己创建，可以是空文件
        // 实际上就是让import语句能执行下去，而不会被不规范的引入打断，如果想要自定化一些逻辑也可以去添加内容
    }
}
~~~

##### 忽略文件

jest的忽略文件配置有5个，我经常会被他们到底忽略啥而弄得焦头烂额😢。。。现在我们就来总体的看一看：

其实这些ignore应该分为三个阶段：

- 测试执行前：
  - testPathIgnorePatterns
    - 用于指定在查找测试文件时要忽略的路径模式。
    - 也就是忽略在root下的某些test文件，不执行这些测试
- 测试执行时：
  - modulePathIgnorePatterns
    - 用于指定在解析模块时要忽略的路径模式。
    - 也就是忽略某些通过模块引入（import/require）的文件，有别名时需要搭配moduleNameMapper使用
  - transformIgnorePatterns
    - 用于指定哪些文件或文件夹不应被 Jest 的转换器处理。
    - 这个之前介绍过，就是忽略一些不需要通过transform编译的文件
- 测试执行后：
  - coveragePathIgnorePatterns
    - 用于指定在生成测试覆盖率报告时要忽略的文件或文件夹的模式。
    - 在`--coverage`模式下生效，我们知道覆盖率一般和测试所覆盖的代码分支有关，但如果我们引入了某些第三方库，而我们写的测试文件显然是不可能包含对第三方库的具体执行分支进行测试的，顶多就测试其返回的结果，那么如果我们不对这个第三方库进行ignore，它内部的代码分支就会加大我们计算覆盖率时分母的基数，也就是会减少我们的覆盖率，这会极大影响我们覆盖率的准确性和程序员的幸福感。
  - watchPathIgnorePatterns
    - 用于指定在 Jest 的 watch 模式（实时监听文件变化）下要忽略的路径模式。
    - 这个是在`--watch`模式下取消某些文件修改后进行热测试的功能，也就是某些文件修改保存后，我不希望其自动再进行测试，而应该是我手动测试

##### 全局环境配置

我们思考一个场景，假设我们有很多测试文件，这些测试文件内部都要依赖一些公共的逻辑，如果我们在每个测试文件都进行这些逻辑的实现，是不是会显得过于繁琐，所以我们考虑将这些公共的逻辑统一进行配置，而要配置我们就需要知道配置项的两个属性：

- setupFiles
  - **执行时机**: 在 Jest 加载测试框架和运行测试之前执行。
  - **用途**: 用于设置全局变量、模拟环境或执行一些在测试框架加载之前必须完成的初始化工作。
  - **应用场景**: 例如，你可以在 `setupFiles` 中设置一些全局变量或配置，例如 `window` 或 `process.env`，为所有测试提供统一的环境。
- setupFilesAfterEnv
  - **执行时机**: 在 Jest 加载测试框架之后、但在运行测试之前执行。
  - **用途**: 用于配置测试框架本身，如引入自定义的匹配器、添加钩子函数，或者配置测试框架的行为。
  - **应用场景**: 例如，你可以在 `setupFilesAfterEnv` 中引入一些 Jest 的扩展，如 `jest-extended` 或 `jest-dom`，或者配置一些测试框架的特定行为。

### 基础语法及功能

#### 基础描述语言

- describe

  用于整合测试，比如说我有多个test单元，但这些test单元测试的都是同一个包内的东西，那么我们就可以将其归类到describe下，举个例子：

  ~~~js
  describe('这是一个包',()=>{
      test('这是测试单元1',()=>{})
      test('这是测试单元2',()=>{})
      test('这是测试单元3',()=>{})
      test('这是测试单元4',()=>{})
  })
  ~~~

  运行结果如下：

  ![](.\image\Snipaste_2024-08-22_11-03-22.png)

- it/test

  it实际上就是test的别名，其作用就是生成test单元，这个就不过多介绍了。

- beforeAll

  在所有测试用例运行之前执行`一次`，通常用于全局的初始化工作。

- beforeEach

  在`每个测试用例运行之前执行`，通常用于设置每个测试用例所需的初始状态。

- afterAll

  在所有测试用例运行之后执行`一次`，通常用于清理全局资源。

- afterEach

  在`每个测试用例运行之后执行`，通常用于清理测试用例所做的任何更改。

- expect

  用于编写断言，验证测试结果是否符合预期。`expect` 接受一个实际值，然后可以调用各种匹配器（如 `toBe`, `toEqual` 等）来验证实际值。

beforeAll/beforeEach/afterAll/afterEach的作用范围：

- 它们会受到describe作用域的影响，比如说我在describe内部使用beforeAll，那么这个beforeAll只会对该describe内部的测试单元起作用

- 但是如果是在文件最外层定义，不管有没有被describe包围的测试单元都会受beforeAll影响，也就是文件内的所有测试单元
- 测试文件之间的beforeAll/beforeEach/afterAll/afterEach不会互相干扰，如果希望建立一个全局的beforeAll/beforeEach/afterAll/afterEach可以考虑配置`setupFilesAfterEnv`

#### mock

mock就是测试中最核心的部分了，弄懂了mock那就是入门测试，把mock玩的6，那就是做出一个优秀测试单元的基础。

我们首先明确mock的**主要功能**：

- 获取函数生命周期状态
- 拦截功能

jest里的**mock分为两个部分**：

- mock函数：jest.fn()
- mock模块：jest.mock()

##### mock函数

如何理解mock函数？其实我们不必想的太复杂，mock函数实际上就是函数，可以像其他函数一样被执行，比如：

~~~js
const mockFn = jest.fn(a=>console.log(a))
mockFn(111) // 111
~~~

它的使用和一般的函数没什么区别，只是在定义上套了一层jest.fn而已。

但是它又相对普通函数有了增量，那就是通过jest.fn包装的mock函数可以记录函数生命周期的各种状态，我们看一下jest.fn()所返回的内容：

~~~js
[Function: mockConstructor] {
      _isMockFunction: true,
      getMockImplementation: [Function (anonymous)],
      mock: [Getter/Setter],
      mockClear: [Function (anonymous)],
      mockReset: [Function (anonymous)],
      mockRestore: [Function (anonymous)],
      mockReturnValueOnce: [Function (anonymous)],
      mockResolvedValueOnce: [Function (anonymous)],
      mockRejectedValueOnce: [Function (anonymous)],
      mockReturnValue: [Function (anonymous)],
      mockResolvedValue: [Function (anonymous)],
      mockRejectedValue: [Function (anonymous)],
      mockImplementationOnce: [Function (anonymous)],
      withImplementation: [Function: bound withImplementation],
      mockImplementation: [Function (anonymous)],
      mockReturnThis: [Function (anonymous)],
      mockName: [Function (anonymous)],
      getMockName: [Function (anonymous)]
}
~~~

这就是mock函数上所有的属性，它会记录mock函数生命周期的各种参数，这些参数可以帮助我们更好的进行测试。

##### mock模块

如何理解mock模块？你就把它想成是`moduleNameMapper`就行了，遇到匹配的路径就会将该模块替换，比如：

~~~js
// 路径匹配后未来如果使用到banana这个变量，即使是深层引用（别的模块使用到），也会被jest.mock拦截
jest.mock('../banana');

const banana = require('../banana');
// 此时的banana已经被拦截

console.log(banana._isMockFunction) //true
// 注意：../banana.js文件一定是实际存在，并且有模块导出语句，不然不能被jest.mock识别
~~~

不过我们还需要注意使用顺序：

~~~js
// 当我们使用的是cjs的模块导入时，可以不必在意使用顺序，因为jest.mock会在编译时默认置顶
const banana = require('../banana');
jest.mock('../banana');
console.log(banana._isMockFunction) //true

// 但是当我们使用es6模块引入时，问题就出现了
jest.mock('../banana');
import banana from'../banana';
console.log(banana._isMockFunction) //true

import banana from'../banana';
jest.mock('../banana');
console.log(banana._isMockFunction) //undefined

// 原因是import语句在编译时也会自动提前，都提前，安能辩谁是大王
~~~

##### mock的拦截机制

大多数情况下，我们需要的是mock的**拦截功能**，也就是把某个函数的执行给拦截下来，换成我们自己定义的mock，这种情况**一般是用于对某些接口数据进行模拟**，因为在实际的开发环境中我们调取某个数据可能需要授权，而在测试环境进行授权一般很困难（比如遇到人机认证），所以我们只能通过拦截这些接口去替换成我们自己设置的静态数据。

但是我们要记住一点，mock的拦截替换机制实际上利用的是模块引入的替换机制，也就是类似`moduleNameMapper`的功能（但又有点不一样，mock模块不需要匹配文件路径，只要路径读的是同一个文件即使不同路径也没关系，这个性能在最佳实践有体现），所以我们只能拦截通过模块引入的函数，其他没有通过模块暴露的变量都不会被拦截，但是有一种情况除外，那就是定义在全局对象上的方法也是可以被拦截的，比如：

~~~js
// demo.js
global.a = ()=>{
    console.log('我不是测试文件')
}
export default ()=>{
    global.a()
}
~~~

~~~js
import demo from '../components/demo.js'
describe('test', () => {
    const a = jest.spyOn(global,'a')
    a.mockReturnValue(console.log('这是测试文件'))
    demo()
    test('demo1',()=>{})
})

// 输出:
// 这是测试文件
~~~

但如果你是这样定义：

~~~js
// demo.js
const a = ()=>{
    console.log('我不是测试文件')
}
export default ()=>{
    a()
}
~~~

~~~js
import demo from '../components/demo.js'
describe('test', () => {
    const a = jest.spyOn(global,'a')
    a.mockReturnValue(console.log('这是测试文件'))
    demo()
    test('demo1',()=>{})
})

// 输出:
// 我不是测试文件
~~~

有点人可能会说，你监听的是global，怎么能mock通过const生成的a呢？但是我们在一般情况下定义的变量不都是绑定在全局对象上吗？

通过上面的内容，我们可以总结两个拦截模块的方法：

- jest.mock
- spyOn

jest.mock可以自定义具体函数的实现过程，而spyOn则需要通过mock对象上的各种方法去实现一些操作（值的返回等）。反正诸位见仁见智，根据具体使用场景去选择吧。

### 最佳实践

写着写着，我好像跑题了，本篇文章的目的主要是如何将jest用于vue项目，实际上对于一些关于逻辑的单元测试，按照配置章节去设置，不涉及dom操作的话，应该是够用了。而涉及到对dom的操作就需要引入一个第三方包`@vue/test-utils`，这个包提供了在测试环境访问vue实例的功能。

我们需要明确，这是一个**测试运行时**包，这个阶段我在忽略文件章节提到过。

我就使用一个快照的案例来作为最佳实践吧。

#### 获取快照

首先我们先定义好需要测试的组件及其相关文件：

~~~vue
<script setup>
// HelloWorld.vue文件
import { ref } from 'vue'
import {getList} from '../api/api'
const tableData = ref([])
getList().then(res=>{
  tableData.value = res.data
})
</script>

<template>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="date" label="Date" width="180" />
    <el-table-column prop="name" label="Name" width="180" />
    <el-table-column prop="address" label="Address" />
  </el-table>
</template>
~~~

~~~js
// api.js文件
// 这是模拟一下接口返回，因为没有具体的接口，所以意思一下
export const getList = ()=>{
    return Promise.resolve({
        code: 200,
        data: [
            {
                date: '2016-05-03',
                name: 'Tom',
                address: 'No. 189, Grove St, Los Angeles',
              },
              {
                date: '2016-05-02',
                name: 'Tom',
                address: 'No. 189, Grove St, Los Angeles',
              },
              {
                date: '2016-05-04',
                name: 'Tom',
                address: 'No. 189, Grove St, Los Angeles',
              },
              {
                date: '2016-05-01',
                name: 'Tom',
                address: 'No. 189, Grove St, Los Angeles',
              },
        ]
    })
}
~~~

这样我们就渲染了一个界面：

![](.\image\Snipaste_2024-08-22_14-48-26.png)

现在我们需要对这个页面进行快照：

~~~js
// snapshot.test.js
import HelloWorld from '../components/HelloWorld.vue'
import { mount } from '@vue/test-utils'

describe('快照最佳实践', () => {
    test('对HelloWorld.vue文件的快照测试', () => {
        const wrapper = mount(HelloWorld)
        expect(wrapper.html()).toMatchSnapshot()
    })
})
~~~

于是我们执行后发现报了一个这样的警告：

>  Failed to resolve component: el-table

原来是我们没有安装element-plus环境，于是我们将安装element-plus：

~~~js
// snapshot.test.js
import HelloWorld from '../components/HelloWorld.vue'
import { mount } from '@vue/test-utils'
import elementPlus from 'element-plus'

describe('快照最佳实践', () => {
    test('对HelloWorld.vue文件的快照测试', () => {
        const wrapper = mount(HelloWorld, { global: { plugins: [elementPlus] } })
        expect(wrapper.html()).toMatchSnapshot()
    })
})
~~~

这回是没有报错了，但是我们的快照测试出了问题，这很正常，因为el-table能被解析了嘛，于是我们更新快照，然后再执行一次测试，测试通过~~

让我们来做一个模拟接口的功能（大家想象一下我的getList是通过ajax获取的，而我现在要写一个mock函数去拦截它）：

~~~js
// mock.js
export const listData = {
    code: 200,
    data: [
        {
            date: '2016-05-03',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          },
          {
            date: '2016-05-02',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          },
          {
            date: '2016-05-04',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          },
          {
            date: '2016-05-01',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          },
    ]
}
~~~

~~~js
// snapshot.test.js
import HelloWorld from '../components/HelloWorld.vue';
import { mount } from '@vue/test-utils';
import elementPlus from 'element-plus';
import {listData} from './__mocks__/mock';
jest.mock('../api/api',()=>({
    getList: jest.fn()
}));
import {getList} from '../api/api';
describe('快照最佳实践', () => {
    test('对HelloWorld.vue文件的快照测试', () => {
        getList.mockReturnValue(Promise.resolve(listData));
        const wrapper = mount(HelloWorld, { global: { plugins: [elementPlus] } });
        expect(wrapper.html()).toMatchSnapshot();
    })
})
~~~

执行测试：

![](.\image\Snipaste_2024-08-22_15-40-50.png)

看到这里相信读者都觉得好像结束了，但是事情没那么简单，如果有执行力强跟着做的朋友可以看看自己的snapshot.test.js.snap文件，是不是会发现表格是不是少了什么东西？没错，就是数据，**因为我们的数据是异步加载的，所以快照并没有把它照进去**，那要怎么解决呢？如果异步是在测试函数里还好，可以显式的调用异步处理函数然后延迟执行exprect函数，但是嵌套在模块里的异步要如何去等待其完成呢？

这里我介绍一个包`flush-promises`

~~~sh
npm i flush-promises
~~~

~~~js
// snapshot.test.js
import HelloWorld from '../components/HelloWorld.vue';
import { mount } from '@vue/test-utils';
import elementPlus from 'element-plus';
import {listData} from './__mocks__/mock';
import flushPromises from 'flush-promises';
jest.mock('../api/api',()=>({
    getList: jest.fn()
}));
import {getList} from '../api/api';
describe('快照最佳实践', () => {
    test('对HelloWorld.vue文件的快照测试', async () => {
        getList.mockReturnValue(Promise.resolve(listData));
        const wrapper = mount(HelloWorld, { global: { plugins: [elementPlus] } });
        await flushPromises();
        expect(wrapper.html()).toMatchSnapshot();
    })
})
~~~

然后再执行测试，就会发现快照完整了。

接下来我们其实可以对测试代码进行一个优化，比如elementPlus的引入，难道我们需要每次写测试都要引入一次吗？这实在是很麻烦。并且对于接口的mock其实我们也可以进行统一管理，这时我们就使用到了`setupFilesAfterEnv`：

~~~js
// jest.setup.js
import elementPlus from 'element-plus';
import { config } from '@vue/test-utils';
config.global.plugins = [elementPlus]

// 这里体现了mock模块即使不是相同路径也没关系，只要链到同一个文件就行
jest.mock('./src/api/api',()=>({
    getList: jest.fn()
}));
~~~

~~~js
// jest.config.js文件
module.exports = {
    preset: 'ts-jest',
    roots: ['<rootDir>/src'],
    testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{vue,js,ts,tsx,jsx}',
        '<rootDir>/src/**/*.{spec,test}.{vue,js,ts,tsx,jsx}'
    ],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['vue', 'js', 'jsx', 'ts', 'tsx', 'json', 'node'],
    resetMocks: true,
    transform: {
        '^.+\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest',
        '^.+\\.(js|jsx|ts|tsx|mjs|cjs)$': '<rootDir>/node_modules/babel-jest',
    },
    moduleNameMapper: {
        '^@/(.*)': '<rootDir>/src/$1',
        '\\.(jpg|png|jpeg|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/__mocks__/fileMock.js',
        '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js',
        "^@vue/test-utils": "<rootDir>/node_modules/@vue/test-utils/dist/vue-test-utils.cjs.js"
    },
    transformIgnorePatterns: [],
    
    // 安装环境
    setupFilesAfterEnv: ['./jest.setup.js']
}
~~~

~~~js
// snapshot.test.js文件
import HelloWorld from '../components/HelloWorld.vue';
import { mount } from '@vue/test-utils';
import {listData} from './__mocks__/mock';
import flushPromises from 'flush-promises';
import {getList} from '../api/api';
describe('快照最佳实践', () => {
    test('对HelloWorld.vue文件的快照测试', async () => {
        getList.mockReturnValue(Promise.resolve(listData));
        const wrapper = mount(HelloWorld);
        await flushPromises();
        expect(wrapper.html()).toMatchSnapshot();
    })
})
~~~

是不是感觉我们的测试文件清爽多了~~~

最佳实践就到这里😎😎😎

[点我去最佳实践项目地址~~](https://github.com/ounstoppableo/forUseJestInVue)

### 问题集及解决方案

#### 生成的元素属性可能是动态

我们使用vue应该知道一个情况，就是一些元素上会存在一些动态的属性，对这些属性进行唯一标识，比如`data-v-023cb0ab`

正常来说@vue/test-utils会帮我们处理，但是也不排除有一些特殊情况，这时我们就需要手动进行清理了，具体清理方法如下：

~~~js
const wrapper = mount(xxx)
wrapper.findAll('[someSurplusAttr]').forEach(el=>el.wrapperElement.removeAttribute('someSurplusAttr'))
~~~

这也是@vue/test-utils提供的能访问具体dom元素，然后依靠dom元素提供的删除属性的方法进行多余属性清除的功能。

#### 关于我的最佳实践为什么使用mount

相信学习jest的读者一定没少看文章，而可能看到其他文章他们使用的可能是shallowMount，这时候你们就会产生一个疑问，为什么我要用mount呢？首先我们明确shallowMount是干什么的，我们观察以下区别：

~~~js
// shallowMount生成的快照
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`快照最佳实践 对HelloWorld.vue文件的快照测试 1`] = `"<el-table-stub data="[object Object],[object Object],[object Object],[object Object]" fit="true" stripe="false" border="false" showheader="true" showsummary="false" highlightcurrentrow="false" defaultexpandall="false" selectonindeterminate="true" indent="16" treeprops="[object Object]" lazy="false" style="width: 100%;" class="" tablelayout="fixed" scrollbaralwayson="false" flexible="false" showoverflowtooltip="false"></el-table-stub>"`;

~~~

~~~js
// mount生成的快照

exports[`快照最佳实践 对HelloWorld.vue文件的快照测试 1`] = `
"<div class="el-table--fit el-table--enable-row-hover el-table--enable-row-transition el-table el-table--layout-fixed" style="width: 100%;" data-prefix="el">
  <div class="el-table__inner-wrapper">
    <div class="hidden-columns">
      <div></div>
      <div></div>
      <div></div>
    </div>
    <div class="el-table__header-wrapper">
      <table class="el-table__header" border="0" cellpadding="0" cellspacing="0">
        <colgroup>
          <col name="el-table_1_column_1" width="180">
          <col name="el-table_1_column_2" width="180">
          <col name="el-table_1_column_3" width="80">
        </colgroup>
        <thead class="">
          <tr class="">
            <th class="el-table_1_column_1 is-leaf el-table__cell" colspan="1" rowspan="1">
              <div class="cell">Date
                <!---->
                <!---->
              </div>
            </th>
            <th class="el-table_1_column_2 is-leaf el-table__cell" colspan="1" rowspan="1">
              <div class="cell">Name
                <!---->
                <!---->
              </div>
            </th>
            <th class="el-table_1_column_3 is-leaf el-table__cell" colspan="1" rowspan="1">
              <div class="cell">Address
                <!---->
                <!---->
              </div>
            </th>
          </tr>
        </thead>
      </table>
    </div>
    <div class="el-table__body-wrapper">
      <div class="el-scrollbar">
        <div class="el-scrollbar__wrap el-scrollbar__wrap--hidden-default">
          <div class="el-scrollbar__view" style="display: inline-block; vertical-align: middle;">
            <table class="el-table__body" cellspacing="0" cellpadding="0" border="0" style="table-layout: fixed;">
              <colgroup>
                <col name="el-table_1_column_1" width="180">
                <col name="el-table_1_column_2" width="180">
                <col name="el-table_1_column_3" width="80">
              </colgroup>
              <!--v-if-->
              <tbody tabindex="-1">
                <tr class="el-table__row">
                  <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->2016-05-03
                    </div>
                  </td>
                  <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->Tom
                    </div>
                  </td>
                  <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->No. 189, Grove St, Los Angeles
                    </div>
                  </td>
                </tr>
                <tr class="el-table__row">
                  <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->2016-05-02
                    </div>
                  </td>
                  <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->Tom
                    </div>
                  </td>
                  <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->No. 189, Grove St, Los Angeles
                    </div>
                  </td>
                </tr>
                <tr class="el-table__row">
                  <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->2016-05-04
                    </div>
                  </td>
                  <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->Tom
                    </div>
                  </td>
                  <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->No. 189, Grove St, Los Angeles
                    </div>
                  </td>
                </tr>
                <tr class="el-table__row">
                  <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->2016-05-01
                    </div>
                  </td>
                  <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->Tom
                    </div>
                  </td>
                  <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                    <div class="cell">
                      <!---->No. 189, Grove St, Los Angeles
                    </div>
                  </td>
                </tr>
              </tbody>
              <!--v-if-->
            </table>
            <!--v-if-->
            <!--v-if-->
          </div>
        </div>
        <transition-stub name="el-scrollbar-fade" appear="false" persisted="true" css="true">
          <div class="el-scrollbar__bar is-horizontal" style="display: none;">
            <div class="el-scrollbar__thumb" style="transform: translateX(0%);"></div>
          </div>
        </transition-stub>
        <transition-stub name="el-scrollbar-fade" appear="false" persisted="true" css="true">
          <div class="el-scrollbar__bar is-vertical" style="display: none;">
            <div class="el-scrollbar__thumb" style="transform: translateY(0%);"></div>
          </div>
        </transition-stub>
      </div>
    </div>
    <!--v-if-->
    <!--v-if-->
  </div>
  <div class="el-table__column-resize-proxy" style="display: none;"></div>
</div>"
`;
~~~

可以发现shallowMount只停留在了组件的表面，并没有深层的去展开组件。当然也并不是说它不好，只是看它符不符合我的使用场景的问题。请读者具体问题具体分析，按照实际要求去进行使用。😘

### 参考

[jest文档](https://jest-archive-august-2023.netlify.app/zh-Hans/docs/getting-started)

[@vue/test-utils文档](https://test-utils.vuejs.org/)