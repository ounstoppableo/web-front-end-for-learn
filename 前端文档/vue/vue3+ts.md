### VUE3之组件间通信

#### props

> 用于父给子组件传值，只读属性
>
> 子组件通过defineProps()接收

#### 自定义事件

> 用于子给父传值
>
> 父亲在子组件上挂载自定义事件，子组件内通过emit触发，emit需要通过defineEmits()获取

#### 全局事件总线

> 需要借助mitt包
>
> 原理：创建一个$bus对象，通过mitt创建的$bus对象上有on和emit方法

#### v-model

> 在vue3中，v-model可以用在子组件身上，效果类似于给子组件添加了自定义事件
>
> 例如父组件给子组件添加属性：v-model:xxx="fn"
>
> 即在子组件上有了名为update:xxx的事件，可以通过emit去触发，并且回调为fn

#### userAttrs

> 在vue3中，通过父组件传递给子组件的属性（在标签内添加的属性），都会被子组件实例的$attrs属性获取，$attrs需要通过组合式API useAttrs()获取
>
> 被props接收的属性将不会在$attrs中显示

#### ref

> 用于父组件修改子组件数据
>
> 通过 **let 子组件ref值 = ref();** 表达式获取到子组件实例
>
> 但是默认子组件的数据是不向外暴露的，父组件想要获得子组件数据就需要在子组件中调用defineExpose()暴露数据

#### $parent

> 用于子组件修改父组件的数据
>
> 在子组件给某些标签添加事件时在回调加上$parent参数，回调就能接收到父组件实例，同样父组件需要先暴露数据，子组件才能拿到

#### provide和inject

> 用于给孙子组件传值
>
> provide()有两个参数，第一个：key；第二个：数据
>
> inject()有一个参数，即key

#### pinia（类似于vuex）

> pinia中只有三个部分：state、actions、getters

~~~javascript
//pinia的index.js文件的创建
import {createPinia} from 'pinia'
//createPinia方法可以用于创建pinia仓库
const store = createPinia()
export default store
~~~

> 然后在main.js引入，引入方式类似vuex

> 创建小仓库，让大仓库管理（store）

~~~javascript
import {defineStore} from 'pinia'
//两个参数，第一个为仓库名，第二个是配置
//defineStore会返回一个函数，作用是让组件可以获取到仓库数据
let useDemoStore = defineStore('demo',{
    //定义state
    state(){
    	return {
            conut: 99
        }
	},
    actions: {
        
    },
    getters: {
        
    },
})
export default useDemoStore
~~~

~~~javascript
//组件获取小仓库数据的方法
import useDemoStore from '...'
let data = useDemoStore()
~~~

> 小仓库的定义也可以使用组合式API的方法

~~~javascript
import {ref,computed,reactive} from 'vue'
let useDemoStore = defineStore('demo',()=>{
    let conut = ref(99)
    const arr = reactive([1,2,3,4,5])
    let total = computed(()=>arr.reduce((pre,next)=>pre+next,0))
	return {
        	count,
        	arr,
            total
    }
})
export default useDemoStore
~~~

#### slot

> 父组件通过\<template v-slot="a"></template>添加具名插槽
>
> 简写\<template #a></template>
>
> 传值主要通过作用域插槽：
>
> 在子组件的<slot></slot>中添加属性，这个属性可以通过父组件的\<template #a></template>接收到
>
> 属性名前需要加$

## 后台管理项目

### 搭建之初

#### 项目初始化

> 使用vite工具初始化 
>
> 详情请看：[vite官网](https://cn.vitejs.dev/)

#### 项目配置

##### eslint配置

> [eslint中文官网](https://eslint.cn/)
>
> 用于对JavaScript代码进行语法检测，也可用于ts

~~~sh
#初始化并下载eslint插件
npm init @eslint/config
#安装依赖
npm i -D eslint-plugin-import eslint-plugin-vue eslint-plugin-node eslint-plugin-prettier eslint-config-prettier eslint-plugin-node @babel/eslint-parser
~~~

~~~javascript
// @see https://eslint.bootcss.com/docs/rules/

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  /* 指定如何解析语法 */
  parser: 'vue-eslint-parser',
  /** 优先级低于 parse 的语法解析配置 */
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
    jsxPragma: 'React',
    ecmaFeatures: {
      jsx: true,
    },
  },
  /* 继承已有的规则 */
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['vue', '@typescript-eslint'],
  /*
   * "off" 或 0    ==>  关闭规则
   * "warn" 或 1   ==>  打开的规则作为警告（不影响代码执行）
   * "error" 或 2  ==>  规则作为一个错误（代码不能执行，界面报错）
   */
  rules: {
    // eslint（https://eslint.bootcss.com/docs/rules/）
    'no-var': 'error', // 要求使用 let 或 const 而不是 var
    'no-multiple-empty-lines': ['warn', { max: 1 }], // 不允许多个空行
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unexpected-multiline': 'error', // 禁止空余的多行
    'no-useless-escape': 'off', // 禁止不必要的转义字符

    // typeScript (https://typescript-eslint.io/rules)
    '@typescript-eslint/no-unused-vars': 'error', // 禁止定义未使用的变量
    '@typescript-eslint/prefer-ts-expect-error': 'error', // 禁止使用 @ts-ignore
    '@typescript-eslint/no-explicit-any': 'off', // 禁止使用 any 类型
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-namespace': 'off', // 禁止使用自定义 TypeScript 模块和命名空间。
    '@typescript-eslint/semi': 'off',

    // eslint-plugin-vue (https://eslint.vuejs.org/rules/)
    'vue/multi-word-component-names': 'off', // 要求组件名称始终为 “-” 链接的单词
    'vue/script-setup-uses-vars': 'error', // 防止<script setup>使用的变量<template>被标记为未使用
    'vue/no-mutating-props': 'off', // 不允许组件 prop的改变
    'vue/attribute-hyphenation': 'off', // 对模板中的自定义组件强制执行属性命名样式
  },
}

~~~

> 生成eslint忽略文件：.eslintignore
>
> 忽略node_modules和dist

> package.json新增两个运行脚本
>
> "scripts": {
>
>   "lint": "eslint src",
>
>   "fix": "eslint src--fix"
>
> }
>
> 分别是eslint语法校验和修复

##### 配置prettier

> prettier是保证格式统一，简单来说eslint是保证代码质量，prettier是保证代码美观

~~~sh
npm install -D eslint-plugin-prettier prettier eslint-config-prettier
~~~

~~~json
//prettierrc.json添加新规则
{
 	"singleQuote": true,
    "semi": false,
    "bracketSpacing": true,
    "htmlWhitespaceSensitivity": "ignore",
    "endOfLine": "auto",
    "trailingComma": "all",
    "tabWidth": 2
}
~~~

> prettierignore忽略文件

~~~
/dist/*
/html/*
.local
/node_modules/**
**/*.svg
**/*.sh
/public/*
~~~

> 可以与eslint src / eslint src --fix 搭配使用

##### 配置stylelint

> stylelint为css校验工具，检测css格式和语法

~~~sh
pnpm add sass sass-loader stylelint postcss postcss-scss postcss-html stylelint-config-prettier stylelint-config-recess-order stylelint-config-recommended-scss stylelint-config-standard stylelint-config-standard-vue stylelint-scss stylelint-order stylelint-config-standard-scss -D
~~~

~~~javascript
//stylelintrc.cjs文件
// @see https://stylelint.bootcss.com/

module.exports = {
  extends: [
    'stylelint-config-standard', // 配置stylelint拓展插件
    'stylelint-config-html/vue', // 配置 vue 中 template 样式格式化
    'stylelint-config-standard-scss', // 配置stylelint scss插件
    'stylelint-config-recommended-vue/scss', // 配置 vue 中 scss 样式格式化
    'stylelint-config-recess-order', // 配置stylelint css属性书写顺序插件,
    'stylelint-config-prettier', // 配置stylelint和prettier兼容
  ],
  overrides: [
    {
      files: ['**/*.(scss|css|vue|html)'],
      customSyntax: 'postcss-scss',
    },
    {
      files: ['**/*.(html|vue)'],
      customSyntax: 'postcss-html',
    },
  ],
  ignoreFiles: [
    '**/*.js',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.ts',
    '**/*.json',
    '**/*.md',
    '**/*.yaml',
  ],
  /**
   * null  => 关闭该规则
   * always => 必须
   */
  rules: {
    'value-keyword-case': null, // 在 css 中使用 v-bind，不报错
    'no-descending-specificity': null, // 禁止在具有较高优先级的选择器后出现被其覆盖的较低优先级的选择器
    'function-url-quotes': 'always', // 要求或禁止 URL 的引号 "always(必须加上引号)"|"never(没有引号)"
    'no-empty-source': null, // 关闭禁止空源码
    'selector-class-pattern': null, // 关闭强制选择器类名的格式
    'property-no-unknown': null, // 禁止未知的属性(true 为不允许)
    'block-opening-brace-space-before': 'always', //大括号之前必须有一个空格或不能有空白符
    'value-no-vendor-prefix': null, // 关闭 属性值前缀 --webkit-box
    'property-no-vendor-prefix': null, // 关闭 属性前缀 -webkit-mask
    'selector-pseudo-class-no-unknown': [
      // 不允许未知的选择器
      true,
      {
        ignorePseudoClasses: ['global', 'v-deep', 'deep'], // 忽略属性，修改element默认样式的时候能使用到
      },
    ],
  },
}
~~~

~~~
stylelintignore文件
/node_modules/*
/dist/*
/html/*
/public/*
~~~

~~~json
//创建运行脚本
"scripts": {
    "lint-style": "stylelint src/**/*.{css,scss,vue} --cache --fix"
}
~~~

##### eslint&prettier&stylelint运行脚本综合配置

~~~json
 "scripts": {
    "dev": "vite --open",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "fix": "eslint src --fix",
    "format": "prettier --write \"./**/*.{html,vue,ts,js,json,md}\"",
    "lint:eslint": "eslint src/**/*.{ts,vue} --cache --fix",
    "lint:style": "stylelint src/**/*.{css,scss,vue} --cache --fix"
  },
~~~

##### 配置husky

> 上面使用了许多代码校验插件，但是需要手动执行命令才能对代码进行格式化，这样很麻烦且容易忘记
>
> husky插件则是在git commit的同时会触发.husky/pre-commit配置文件中预设的命令，可以在其中添加pnpm run format达到提交前自动格式化代码的效果

~~~sh
npm i -D husky
#git init后再执行
npx husky-init
~~~

##### 配置commitlint

> 控制commit时的消息，commit时的消息也是需要有规范的

~~~sh
#安装包
npm add @commitlint/config-conventional @commitlint/cli -D
~~~

~~~javascript
//commitint.config.cjs文件
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // 校验规则
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'build',
      ],
    ],
    'type-case': [0],
    'type-empty': [0],
    'scope-empty': [0],
    'scope-case': [0],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never'],
    'header-max-length': [0, 'always', 72],
  },
}
~~~

~~~json
//配置命令
"scripts": {
    "commitlint": "commitlint --config commitlint.config.cjs -e -V"
}
~~~

~~~SH
#配置该命令在husky中
npx husky add .husky/commit-msg
~~~

> 在commit-msg文件中添加npm run commitlint

> 配置完，当我们添加commit信息时，就需要按照以下格式：
>
> 'feat',//新特性、新功能
> 'fix',//修改bug
> 'docs',//文档修改
> 'style',//代码格式修改, 注意不是 css 修改
> 'refactor',//代码重构
> 'perf',//优化相关，比如提升性能、体验
> 'test',//测试用例修改
> 'chore',//其他修改, 比如改变构建流程、或者增加依赖库、工具等
> 'revert',//回滚到上一个版本
> 'build',//编译相关的修改，例如发布版本、对项目构建或者依赖的改动

> 例如：git commit -M "feat: 新增内容"

#### 项目集成

##### 集成element-plus

> 安装element-plus
>
> 参考[element-plus官方文档](https://element-plus.org/zh-CN/)

##### src别名配置

~~~javascript
//vite.config.ts文件中
...
import path from 'path'
export default defineConfig({
    ...
    resolve: {
      alias: {
        "@": path.resolve("./src")  
      },
    },
})
~~~

~~~json
//tsconfig.json
{
    "compilerOptions": {
        "baseUrl": "./", //解析当前位置
        "paths": {  //路径映射，相对baseUrl
            "@/*": ["src/*"]
        }
    }
}
~~~

##### 环境变量的配置

> 项目根目录分别添加开发、生产、测试环境的文件
>
> .env.development
>
> .env.production
>
> .env.test

~~~
#.env.development文件
#变量必须以VITE_为前缀才能暴露给外部读取
NODE_ENV = 'development'
VITE_APP_TITLE = 'MyApp'
VITE_APP_BASE_API = '/dev-api'
~~~

~~~
#.env.production文件
NODE_ENV = 'production'
VITE_APP_TITLE = 'MyApp'
VITE_APP_BASE_API = '/prod-api'
~~~

~~~
#.env.test文件
NODE_ENV = 'test'
VITE_APP_TITLE = 'MyApp'
VITE_APP_BASE_API = '/test-api'
~~~

~~~json
//package.json文件下配置运行命令
"scripts": {
    "dev": "vite --open", //默认使用开发环境的配置文件
    "build:test": "vue-tsc & vite build --mode test",
    "build:pro": "vue-tsc & vite build --mode production",
    "preview": "vite preview"
}
~~~

> 通过import.meta.env获取环境变量

~~~javascript
//例如
console.log(import.meta.env.VITE_APP_BASE_API)
~~~

##### 项目中SVG图标的集成和使用

~~~sh
#安装svg依赖插件
npm install vite-plugin-svg-icons -D
~~~

~~~javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//引入svg插件
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    createSvgIconsPlugin({
      // 将来引入svg图标放置的位置
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      // 使用svg图标时添加的id的模板
      symbolId: 'icon-[dir]-[name]',
    }),],
})
~~~

~~~javascript
//在main.ts中导入入口文件
import 'virtual:svg-icons-register'
~~~

~~~html
<!-- svg标签的使用 -->
<!-- svg为容器节点，需要与use搭配使用 -->
<svg>
    <!-- use的xlink:href属性指定要用的svg图标的id，格式：icon-[dir]-[name] -->
	<use xlink:href=“#icon-xxx”></use>
</svg>
~~~

> 这样一个一个引用会比较麻烦，所以我们需要对svg图标进行封装

~~~vue
<template>
    <svg :width="width" :height="height">
        <use :xlink:href="prefix+name" :fill="color"></use>
    </svg>
</template>
<script setup lang="ts">
defineProps({
    prefix: {
        type: String,
        default: '#icon-'
    },
    name: String,
    color: {
        type: String,
        default: ''
    },
    width: {
        type: String,
        default: '16px'
    },
    height: {
        type: String,
        default: '16px'
    },

})
</script>
<style></style>
~~~

> 然后将该组件注册成全局组件，就不需要每次使用都要引入了

~~~typescript
import SvgIcon from '@/components/SvgIcon/svg-icon.vue';
interface globalComponents {
    [index: string]: any
}
const allGlobalComponents: globalComponents = { SvgIcon }
//配置全局组件的注册
export default {
    //main.ts中app.use()会自动调用install方法,并且传入app参数
    install(app: any) {
        Object.keys(allGlobalComponents).forEach(key => {
            app.component(key, allGlobalComponents[key])
        })
    }
}
~~~

##### 集成sass

> 写项目前需要配置一下全局样式，我们用sass来配置
>
> 在src/style目录下创建一个index.scss文件

> 在main.ts引入index.scss
>
> ~~~javascript
> import '@/style/index.scss'

> 在index.scss添加一些默认样式
>
> ~~~css
> /**
>  * ENGINE
>  * v0.2 | 20150615
>  * License: none (public domain)
>  */
> 
> *,
> *:after,
> *:before {
>     box-sizing: border-box;
> 
>     outline: none;
> }
> 
> html,
> body,
> div,
> span,
> applet,
> object,
> iframe,
> h1,
> h2,
> h3,
> h4,
> h5,
> h6,
> p,
> blockquote,
> pre,
> a,
> abbr,
> acronym,
> address,
> big,
> cite,
> code,
> del,
> dfn,
> em,
> img,
> ins,
> kbd,
> q,
> s,
> samp,
> small,
> strike,
> strong,
> sub,
> sup,
> tt,
> var,
> b,
> u,
> i,
> center,
> dl,
> dt,
> dd,
> ol,
> ul,
> li,
> fieldset,
> form,
> label,
> legend,
> table,
> caption,
> tbody,
> tfoot,
> thead,
> tr,
> th,
> td,
> article,
> aside,
> canvas,
> details,
> embed,
> figure,
> figcaption,
> footer,
> header,
> hgroup,
> menu,
> nav,
> output,
> ruby,
> section,
> summary,
> time,
> mark,
> audio,
> video {
>     font: inherit;
>     font-size: 100%;
> 
>     margin: 0;
>     padding: 0;
> 
>     vertical-align: baseline;
> 
>     border: 0;
> }
> 
> article,
> aside,
> details,
> figcaption,
> figure,
> footer,
> header,
> hgroup,
> menu,
> nav,
> section {
>     display: block;
> }
> 
> body {
>     line-height: 1;
> }
> 
> ol,
> ul {
>     list-style: none;
> }
> 
> blockquote,
> q {
>     quotes: none;
>     &:before,
>     &:after {
>         content: '';
>         content: none;
>     }
> }
> 
> sub,
> sup {
>     font-size: 75%;
>     line-height: 0;
> 
>     position: relative;
> 
>     vertical-align: baseline;
> }
> sup {
>     top: -.5em;
> }
> sub {
>     bottom: -.25em;
> }
> 
> table {
>     border-spacing: 0;
>     border-collapse: collapse;
> }
> 
> input,
> textarea,
> button {
>     font-family: inhert;
>     font-size: inherit;
> 
>     color: inherit;
> }
> 
> select {
>     text-indent: .01px;
>     text-overflow: '';
> 
>     border: 0;
>     border-radius: 0;
> 
>     -webkit-appearance: none;
>        -moz-appearance: none;
> }
> select::-ms-expand {
>     display: none;
> }
> 
> code,
> pre {
>     font-family: monospace, monospace;
>     font-size: 1em;
> }
> ~~~

> 接下来配置一些东西使项目能够使用sass全局变量
>
> 在src/style下创建variable.scss文件
>
> 然后在vite.config.ts文件配置：
>
> ~~~ts
> export default defineConfig({  
> css: {
>     preprocessorOptions: {
>       scss: {
>         javascriptEnabled: true,
>         additionalData: '@import "./src/style/variable.scss";',
>       },
>     },
>   },
> })
> ~~~
>
> 之后添加变量就在variable.scss文件中

##### mock数据

> 用于搭建一些假的接口，方便我们后期项目数据请求

~~~sh
npm install -D vite-plugin-mock mockjs
~~~

~~~typescript
//vite.config.ts文件中添加插件
export default defineConfig({
     plugins: [
         viteMockServe({
             enable: true,
         }),
     ],
})
~~~

> 在项目根目录下，创建mock文件夹，用于创建假接口

~~~ts
//mock/user.ts
//createUserList:次函数执行会返回一个数组,数组里面包含两个用户信息
function createUserList() {
    return [
        {
            userId: 1,
            avatar:
                'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
            username: 'admin',
            password: '111111',
            desc: '平台管理员',
            roles: ['平台管理员'],
            buttons: ['cuser.detail'],
            routes: ['home'],
            token: 'Admin Token',
        },
        {
            userId: 2,
            avatar:
                'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
            username: 'system',
            password: '111111',
            desc: '系统管理员',
            roles: ['系统管理员'],
            buttons: ['cuser.detail', 'cuser.user'],
            routes: ['home'],
            token: 'System Token',
        },
    ]
}
//对外暴露一个数组:数组里面包含两个接口
//登录假的接口
//获取用户信息的假的接口
export default [
    // 用户登录接口
    {
        url: '/api/user/login',//请求地址
        method: 'post',//请求方式
        response: ({ body }) => {
            //获取请求体携带过来的用户名与密码
            const { username, password } = body;
            //调用获取用户信息函数,用于判断是否有此用户
            const checkUser = createUserList().find(
                (item) => item.username === username && item.password === password,
            )
            //没有用户返回失败信息
            if (!checkUser) {
                return { code: 201, data: { message: '账号或者密码不正确' } }
            }
            //如果有返回成功信息
            const { token } = checkUser
            return { code: 200, data: { token } }
        },
    },
    // 获取用户信息
    {
        url: '/api/user/info',
        method: 'get',
        response: (request) => {
            //获取请求头携带token
            const token = request.headers.token;
            //查看用户信息是否包含有次token用户
            const checkUser = createUserList().find((item) => item.token === token)
            //没有返回失败的信息
            if (!checkUser) {
                return { code: 201, data: { message: '获取用户信息失败' } }
            }
            //如果有返回成功信息
            return { code: 200, data: { checkUser } }
        },
    },
]
~~~

##### axios二次封装

> 使用aixos的请求拦截器和响应拦截器处理一些业务：
>
> 请求拦截器：开始进度条、请求头携带公共参数
>
> 响应拦截器：进度条结束、简化服务器返回的数据、处理http网络错误

> 在src下创建utils/request.ts

~~~ts
import axios from 'axios'
//对axios进行二次封装，axios.create方法可以初始化配置，并返回一个新的axios对象
let request = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 5000
})
//配置请求拦截器    
request.interceptors.request.use((config) => {
    //config.header为请求头，通常会用来添加一些公共请求头
    return config
})
//配置响应拦截器
request.interceptors.response.use((response) => {
    //进行返回值提取,简化数据
    return response.data
}, (err) => {
    let message: string = ''
    let status: number = err.status
    switch (status) {
        case 401:
            message = 'TOKEN过期'
            break;
        case 403:
            message = '访问被拒绝'
            break;
        case 404:
            message = '请求地址错误'
            break;
        case 500:
            message = '服务器崩溃了'
            break;
    }
    alert(message)
    return Promise.reject(err)
})
export default request
~~~

##### API接口统一管理

> 将每个API接口请求都封装成一个函数，使用时直接调用该函数就可以直接发起请求
>
> 文件放在src/api

### 正式搭建

#### 创建路由

> 安装下载vue-router
>
> [vue-router官网](https://router.vuejs.org/zh/)

#### 安装pinia仓库

> [pinia官网](https://pinia.vuejs.org/zh/)

> 一些坑：在组件外部使用小仓库要先引入pinia

#### 一些重要的点

##### 路由鉴权

> 控制项目中的页面能否被访问

> 使用全局守卫：beforeEach((to,from,next)=>{})；afterEach((to,from)=>{})

> 要做到：
>
> 未登录：所有路由指向login
>
> 登录成功：login不能访问，其余都可以访问
>
> 登录后有用户信息：放行
>
> 登录后无用户信息：在守卫发请求获取用户信息

##### 进度条功能

> 利用全局守卫+nprogress

##### 真实接口

> 服务器域名：
> http://sph-api.atguigu.cn
>
> swagger文档：
>
> http://39.98.123.211:8510/swagger-ui.html
>
> http://139.198.104.58:8212/swagger-ui.html#/

##### 对于什么时候定义类型

> 一般是对需要复用的函数进行类型定义，对该函数的参数以及返回值进行约束，这样别人在用的时候就能得到错误反馈

