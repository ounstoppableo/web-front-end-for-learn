### webpack基础

***讲解包含什么、有什么用、如何使用***

#### 为什么要使用打包工具

将ES6模块化语法(import)、vue、react、sass/less等浏览器不能识别的语法编译为浏览器能识别的语法。

除此之外，打包工具还能压缩代码、做兼容处理、提升代码性能等。

#### 常见打包工具

- grunt
- gulp
- parcel
- webpack
- rollup
- vite

目前市面上主流是webpack。

#### 基本使用

它会以一个或多个文件作为打包入口，将整个项目所有文件编译组合成一个或多个文件输出出去。

输出的文件就是编译好的文件，就可以在浏览器运行了。

***webpack***输出的文件叫做***bundle***。

##### 功能介绍

- 开发模式：仅能编译JS中的ES module语法
- 生产模式：能编译JS中的ES module语法，还能压缩JS代码

##### webpack安装

新建一个文件，文件名不能叫webpack

~~~sh
npm init -y
#webpack-cli表示指令包
npm i webpack webpack-cli -D
#使用默认配置启动，入口会查找package.json内部的main属性值,output默认为根路径的./dist
npx webpack
#定义入口和出口的方法
npx webpack --entry ./first.js --entry ./second.js --output-path /build
#使用配置文件的方式启动
npx webpack --config 配置文件 
~~~

#### 基本配置

##### 五个核心概念

- entry（入口）

  指示webpack从哪个文件开始打包

- output（输出）

  指示webpack打包完的文件输出到哪里去，如何命名等

- loader（加载器）

  webpack本身只能处理js、json等资源，其他资源需要借助loader，webpack才能解析

- plugins（插件）

  拓展webpack的功能

- mode（模式）

  开发模式、生产模式

##### 准备webpack配置文件

在下载webpack包的主文件下添加一个文件***webpack.config.js***

~~~javascript
const path = require('path')
module.exports = {
    //入口
    entry: './main.js',
    //输出
    output: {
     	//绝对路径
      	//__dirname表示当前文件的文件夹路径
        //开发环境path值为undefined，一般不需要输出文件
        path: path.resolve(__dirname,'dist'),
        filename: 'main.js',
    },
    //加载器
    module: {
        rules: [
      		//loader的配置      
        ],
    },
    //插件
    plugins: [  
    ],
    //模式
    mode: 'develoment',
}
~~~



#### loader

##### 处理样式资源

如何使用webpack处理css、less、sass、scss、styl样式资源

webpack本身不能处理样式资源，需要借助loader

如何使用需要查看[官方文档](https://www.webpackjs.com/loaders/)

###### 处理CSS资源

下载css-loader

~~~sh
npm i --save-dev css-loader
npm i --save-dev style-loader
~~~

引入任意css资源到main.js

~~~javascript
import css from "file.css"
~~~

修改webpack.config.js中的module属性

~~~javascript
module: {
      rules: [
      	//loader的配置
        {
            test: /\.css$/,  //只检测.css结尾文件
            use: [
                "style-loader",  //将JS中CSS通过创建style标签添加html文件中生效
                "css-loader"  //将CSS资源编译成commonjs的模块到js中
            ],  //解析使用的模型，从下到上使用
        },
      ],
}
~~~

后续处理less、sass都类似，***详细过程可以去官方文档查看***

##### 处理图片资源

过去处理图片需要通过file-loader，url-loader进行处理

webpack5已经将这些loader内置，使用只需要激活即可

~~~javascript
module: {
      rules: [
     	  //loader的配置
          {
              test: /\.(png|jpe?g|gif|webp)$/,
              type: "asset",
              //将小图片转化成base64编码方式，可选
              parser: {
                  //小于10kb的图片转换成base64
                  //优点：减少请求数量
                  //缺点：体积会增大
                  maxSize: 10*1024
              }
          }，
      ],
},
~~~

###### 修改输出文件目录

配置文件中output属性中的path属性表示所有文件打包后的输出目录，显然不满足分级要求（图片在一个目录，js在一个目录）

~~~JavaScript
module: {
      rules: [
     	  //loader的配置
          {
              test: /\.(png|jpe?g|gif|webp)$/,
              type: "asset",
              //将小图片转化成base64编码方式，可选
              parser: {
                  //小于10kb的图片转换成base64
                  //优点：减少请求数量
                  //缺点：体积会增大
                  maxSize: 10*1024
              },
              generator: {
                  //生成输出图片名称
                  //[hash:10]表示hash值只取十位，[ext]表示拓展名，[query]表示查询字符串名
                  filename: "static/images/[hash:10][ext][query]"
              }
          }，
      ],
},
~~~

##### clear

配置文件中output属性增加clear属性可以在每次打包时***清除原来的输出文件***

~~~javascript
module.exports = {
    output: {
        path: path.resolve(__dirname.'dist'),
        filename: 'main.js',
        clear: true,
    },
}
~~~

#### 处理JS资源

webpack处理js资源是有限的，只能处理模块化语法

为了使js能够在ie等浏览器运行，所以需要做一些兼容处理

并且由于团队对代码风格有严格要求，所以还需要对代码格式做处理

- babel：处理兼容性问题
- eslint：处理代码格式问题

先使用eslint处理代码格式，再使用babel处理兼容问题

##### eslint

###### 配置文件

命名方法：

- .eslintrc.*：新建文件，位于项目根目录
  - .eslintrc
  - .eslintrc.js
  - .eslintrc.json
- 也可在package.json中直接添加eslint属性

具体配置：

~~~javascript
module.exports = {
    //解析选项
    parseOptions: {
        ecmaVersion: 6,  //ES语法版本
        sourceType: "module", //ES模块化语法
        ecmaFeatures: {  //ES其他特性
            jsx: true,  //如果是react项目，就需要开启jsx
        }
    },
    //具体检查规则
    //off\0 - 关闭规则
    //warn\1 - 开启规则，警告级别错误，不会退出运行
    //error\2 - 开启规则，错误级别错误，会退出程序
    rules: {
        semi: "error",  //禁止使用分号
        'array-callback-return': "warn",  //强制数组方法中的回调函数中有return语句
        'default-case': [
          'warn',  //要求switch语句中有default分支，否则警告
           { commentPattern: '^no default$' }  //运行在最后注释no default，就不会有警告了
        ],
        eqeqeq: [
            'warn',  //强制使用===和!==
            'smart',  //智能识别特例，文档中可查询特例
        ]
    },
    //继承其他规则
    extends: [],
    //...
    //其他规则详见：https://eslint.bootcss.com/docs/user-guide/configuring
};
~~~

继承现有规则：

开发中一点点写rules不现实，可以使用现成的规则

- eslint官方规则：eslint:recommended
- vue cli官方规则：plugin:vue/essential
- react cli官方规则：react-app

~~~sh
npm i react-app
~~~

~~~javascript
module.exports = {
	extends: ['react-app'],
	rules: {
      	//在里面写的规则会覆盖继承的规则
      	//所以想修改直接添加就行
        eqeqeq: ['warn','smart'],
    },
}
~~~

###### eslint的使用

webpack5中eslint作为插件使用

安装：

~~~sh
npm i eslint-webpack-plugin eslint --save-dev
~~~

然后把插件添加到webpack配置文件：

~~~javascript
const ESlintPlugin = require('eslint-webpack-plugin')  //plugin的使用与loader不一样，plugin需要引入
module.exports = {
    plugins: [new ESlintPlugin({
        context: path.resolve(__dirname,"src")  //eslint配置文件路径
    })],
}
~~~

##### babel

将ES6语法编写的代码转换为向后兼容的js语法

###### 配置文件

- babel.config.*：新建文件，位于项目根目录
  - babel.config.js
  - babel.config.json
- .babelrc.*
  - .babelrc
  - .babelrc.js
  - .babelrc.json
- 也可以在package.json中直接添加babel属性

###### 具体配置

~~~javascript
module.exports = {
    //预设
    //用于拓展babel功能，一组babel插件
    //@babel/preset-env :智能预设，允许使用javascript最新语法
	//@babel/preset-react :用来编译react jsx语法的预设
	//@babel/preset-typescript :一个用于编译typescript语法的预设
    //预设使用前需npm下载
    presets: [],
}
~~~

###### babel的使用

babel使用loader处理

下载：

~~~sh
npm i -D babel-loader @babel/preset-env @babel/core
~~~

在webpack.config.js中添加loader

~~~javascript
module: {
	rules: [
		{
            test: /\.js$/,
            exclude: /node_modules/,  //排除node_modules文件不处理
            use: {
                loader: 'babel-loader',
                //options: {
                //    presets: ['@babel/preset-env']
                //}
                //options可在外面写也可在里面写
                
            }
        },			
	],
}
~~~

#### 处理html资源

主要处理如何引入js、css等资源，自动生成路径

~~~sh
npm i --save-dev html-webpack-plugin
~~~

在插件中引入：
~~~javascript
const HtmlWebpackPlugin = require('html-webpack-plugin')
plugins: [
	new HtmlWebpackPlugin({
        template: path.resolve(__dirname,"public/index.html")  //源文件路径，处理是在源文件的基础上添加js、css的资源路径
    })
]
~~~

#### 开发服务器&自动化

代码修改后总需要手动打包，自动化则是根据代码修改而响应式打包

~~~sh
npm i webpack-dev-server -D
~~~

在webpack.config.js中添加配置

~~~javascript
devServer: {
	host: "localhost",
	port: "3000",
	open: true,
}
~~~

~~~sh
#启动devServer
npx webpack serve
~~~

***开发服务器并不会输出资源（dist不会增加文件）,自会在浏览器显示结果***

#### 生产模式

生产模式是开发完代码后，需要得到代码将来部署上线

这个模式下主要对代码进行优化，让其运行性能更好

优化主要从两个角度出发：

- 优化代码运行性能
- 优化代码打包速度

##### 重新编写webpack.config.js

一般是新建一个文件夹，开发环境命名为webpack.dev.js，生产环境命名为webpack.prod.js

一般把这两个文件放在一个新的文件夹config下

所以需要修改路径：相对路径不需要修改，因为都是相对于命令行执行路径（根路径）

并且不需要dev-server

~~~javascript
const path = require('path')
module.exports = {
    entry: './main.js',
    output: {
        path: path.resolve(__dirname,'dist'),
        filename: 'main.js',
    },
    module: {
        rules: [
      		//loader的配置      
        ],
    },
    plugins: [  
    ],
    mode: 'production',
}
~~~

##### 提取CSS成单独文件

由于把css写入js中会导致闪屏现象，所以需要单独打包CSS，然后使用link引入

~~~sh
npm i --save-dev mini-css-extract-plugin
~~~

~~~javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = {
    ...
    module: {
        rules: [
            //使用MiniCssExtractPlugin.loader替代style.loader
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader,'css-loader']
            },
        ],
    },
    plugins: [new MiniCssExtractPlugin({
        filename: 'static/css/main.css',  //指定保存路径
    })],
}
~~~

##### CSS兼容性处理

~~~sh
npm i postcss-loader postcss postcss-preset-env -D
~~~

~~~javascript
//需要在css-loader之下less-loader之上处理
module: {
    rules: [
          {
              test: /\.css$/,
              use: [
                  MiniCssExtractPlugin.loader,
                  'css-loader',
                  {
                   	loader: "postcss-loader",
                   	options: {
                        postcssOptions: {
                            plugins: [
                                "postcss-preset-env",  //能解决大多兼容性问题
                            ],
                        }
                    }
                  }，
                  'less-loader',
                   ],
          },
    ]
}
~~~

~~~json
//在package.json中添加browserlist属性指定兼容版本
"broserlist": {
    "ie>=8"
}
//实际会这样写
"broserlist": {
    "last 2 version",  //最近两个版本
    ">1%",  //覆盖99%的浏览器
    "not dead"  //不要已经死的浏览器
    //取交集
}
~~~

##### CSS压缩

~~~sh
npm i css-minimizer-webpack-plugin --save-dev
~~~

~~~javascript
const cssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')
module.exports = {
    ...
    plugins: [
        new cssMinimizerWebpackPlugin(),
    ]
}
~~~



### webpack高级

***webpack高级优化配置，提升项目打包和运行时的性能***



### webpack项目

***从零开始搭建一个项目脚手架，并进行优化***

### webpack原理

***webpack、loader、plugin原理***

