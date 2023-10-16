### 前言

> angular这门框架相比于vue更注重自己的封装，所以对于angular不需要记太多功能，但是一些基本的原理必须要弄清楚。以下是angular一些重难点的阐述：

### eventEmitter机制

说到框架，组件传值绝对是一个绕不开的话题，vue中，组件传值的方式有很多种，甚至还开发出了一些工具包，但其实原理都万变不离其宗（单例）。而angular就没有弄那么多花里胡哨的东西，传值就通过两个方法：

- 一个是父传子，通过对子组件加上binding，即\<app-test [demo]="demo">\</app-test>
- 一个是多功能传值机制eventEmitter

由于binding这个功能比较简单，所以就不做过多赘述，下面主要讲一讲eventEmitter

#### eventEmitter的用法

- 也是通过在子组件上进行绑定，但是绑定的是一个方法，即通过()绑定
- 然后子组件通过@Output进行接收
- @Output接收的实例需要为new EventEmitter()

~~~ts
//父组件模板下
<app-test (demo)="test()"></app-test>
//子组件ts文件下
@Output()
demo = new EventEmitter()

//使用的时候通过调用emit方法去掉用test方法
demo.emit()


//我们也可以进行传值，但是test接收必须命名为$event
//父组件模板下
<app-test (demo)="test($event)"></app-test>
//子组件ts文件下
@Output()
demo = new EventEmitter()

demo.emit(value)
~~~

#### eventEmitter使用场景

通过以上的用例，我们可以知道，eventEmitter最基本的用法就是可以实现子传值给父组件，但是父组件接收必须通过$event标识符

- 但是由于他的可传参性质，它可以实现兄弟间传值

~~~ts
//我们假设使用binding的方式进行传值
//兄弟1
<app-son1 (son1Test)="test($event)"></app-son1>
//兄弟2
<app-son2 [son1Test]="value"></app-son2>

//我们发现根本无从下手，因为binding必须通过父组件进行传值，如果是父组件里的属性还好，但如果只是单单某个兄弟组件的一个属性呢？
//这时候只能通过eventEmitter

//父ts
value = ''
test(value){
    this.value = value
}
//以上通过两个方式的搭配，就实现了兄弟间的传值
~~~

- 甚至也可以调用父组件中的方法

~~~ts
<app-son1 (son1Test)="test($event)"></app-son1>

//父ts
value = ()=>{}
test(value){
    this.value(value)
}
//这样以来，由于方法的可操作性很强，所以可以实现单个子组件对其他多个子组件的影响
~~~

> 组件传值说起来简单，但是实际使用的时候很容易混乱，这时候我们需要冷静下来，仔细思考传值间的两个组件究竟是什么关系，到底是哪个组件要操作哪个组件，最终要达到什么效果，然后在以此确定需要使用的方法

### 装饰器

> 装饰器是typescript的重要知识点，学装饰器最主要的就是把握住装饰器能接收到的参数

#### 装饰器的种类

- 类装饰器
- 方法装饰器
- 属性装饰器

#### 装饰器的写法

~~~ts
//假设有一个sealed装饰器
//target表示被装饰的类（非实例）
function sealed(target) {
    // do something with "target" ...
}
~~~

##### 装饰器工厂

> 装饰器工厂主要是针对方法装饰器的

~~~ts
function color(value: string) { // 这是一个装饰器工厂
    return function (target) { //  这是装饰器
        // do something with "target" and "value"...
    }
}
//这样才能被@color()正常调用
~~~

#### 复写装饰器执行顺序

~~~ts
function f() {
    console.log("f(): evaluated");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("f(): called");
    }
}

function g() {
    console.log("g(): evaluated");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("g(): called");
    }
}

class C {
    @f()
    @g()
    method() {}
}
~~~

~~~
//控制台输出
f(): evaluated
g(): evaluated
g(): called
f(): called
//也就是说，装饰器是近的先执行
~~~

> 类中不同声明上的装饰器将按以下规定的顺序应用：
>
> 1. *参数装饰器*，然后依次是*方法装饰器*，*访问符装饰器*，或*属性装饰器*应用到每个实例成员。
> 2. *参数装饰器*，然后依次是*方法装饰器*，*访问符装饰器*，或*属性装饰器*应用到每个静态成员。
> 3. *参数装饰器*应用到构造函数。
> 4. *类装饰器*应用到类。

#### 类装饰器

> 类装饰器一般用于给类重载、添加方法、属性

~~~ts
//它会接收一个构造函数，为唯一参数
function classDecorator<T extends {new(...args:any[]):{}}>(constructor:T) {
    return class extends constructor {
        newProperty = "new property";
        hello = "override";
    }
}

@classDecorator
class Greeter {
    property = "property";
    hello: string;
    constructor(m: string) {
        this.hello = m;
    }
}

console.log(new Greeter("world"));
//由于类构造函数被重载，所以hello为"override"
~~~

#### 方法装饰器

~~~ts
//target为构造函数，propertyKey为方法名，descriptor为属性描述符
function test() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    };
}
~~~

~~~ts
//下面是一个监听页面大小变化的方法装饰器
export default function ViewResize() {
  return function (
    target: any,
    propertyKey: string,
    descriptor?: PropertyDescriptor,
  ) {
     //区分生命周期方法
    if (propertyKey === 'ngAfterViewInit') {
      const fn = descriptor!.value;
       //重载方法
      descriptor!.value = function () {
          //记住要保留原来的方法
          //这里因为是重载，所以this是在调用后确定的，也就是类实例
        fn.call(this);
        onResize(this);
      };
    }
    if (propertyKey === 'ngOnDestroy') {
      const fn = descriptor!.value;
      descriptor!.value = function () {
        fn.call(this);
        window.onresize = null;
      };
    }
    if (propertyKey === 'ngOnInit') {
      const fn = descriptor!.value;
      descriptor!.value = function () {
        fn.call(this);
        pageControl(this);
      };
    }
  };
}
//监控页面大小变化事件
function onResize(self: any) {
  window.onresize = () => {
    pageControl(self);
  };
}
//页面参数控制
function pageControl(self: any) {
  if (innerWidth < 1024) {
    self.smallSize = true;
  } else {
    self.smallSize = false;
  }
  document.documentElement.style.setProperty(
    '--bodyHeight',
    innerHeight + 'px',
  );
}

~~~

#### 属性装饰器

~~~ts
//接收构造函数和属性名
function demo(target: any, propertyKey: string) {
}
~~~

### pipe

pipe是一个内容过滤工具，其用法类似于webpack的loader，使用时可以接收到 | 前的值作为参数

~~~ts
//这是一个markdown转换为html的pipe
import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
@Pipe({
  name: 'marked',
})
export class MarkedPipe implements PipeTransform {
    //接收到 | 前的值
  transform(value: any): any {
    if (value && value.length > 0) {
        //进行转换后返回
      return String(marked.parse(value));
    }
    return value;
  }
}
~~~

### 生命周期

angular的生命周期为如下：

> - ngOnChanges()：输入属性发生改变时调用，**要注意是输入属性（@Input()）**，非输入属性则不会调用
> - ngOnInit()：数据初始化时调用，用于数据初始化
> - ngDoCheck()：不常用
> - ngAfterContentInit()：不常用
> - ngAfterContentChecked()：不常用
> - ngAfterViewInit()：类似mounted()，即页面初始化完成后调用，通常一些dom操作都在这
> - ngAfterViewChecked()：页面变化结束后调用，类似update()，但是注意不要进入死循环
> - ngOnDestroy()：用于清除一些宏任务

### 动画

> 主要说一下用法

~~~ts
//app-module中需要引入
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule
  ],
  declarations: [ ],
  bootstrap: [ ]
})
export class AppModule { }
~~~

~~~ts
//对于某个组件,我们要使用动画就需要引入以下方法
//更多在 https://angular.cn/guide/animations#animation-api-summary
import {
  trigger,  //动画触发器
  state,  //表示状态
  style, //样式
  animate, //动画
  transition, //过渡
  // ...
} from '@angular/animations';
~~~

~~~ts
//具体用法
@Component({
	//...
	animations: [
        //触发器的声明
		trigger('openClose',[
            //先定义初始和终止状态
            state('open', style({
        		height: '200px',
        		opacity: 1,
        		backgroundColor: 'yellow'
      		})),
     		 state('closed', style({
        		height: '100px',
       		 	opacity: 0.8,
        		backgroundColor: 'blue'
      		})),
            //添加状态改变的过渡
             transition('open => closed', [
       			 animate('1s')
     		 ]),
     		 transition('closed => open', [
        		animate('0.5s')
     		 ]),
        ])
	],
})
//然后我们可以在模板中调用触发器
<div [@openClose]="isOpen?'open':'close'">…</div>;
<button type="button" (click)="toggle()">Toggle Open/Close</button>

toggle(){this.isOpen=!this.isOpen}
~~~

~~~ts
//使用query和stagger
//query是选择器，找出在动画序列中正在播放的元素中查找一个或多个内部元素
//stagger可以和query搭配实现交错动画的效果
@Component({
	//...
  template: `
    <button (click)="toggle()">Show / Hide Items</button>
	<hr />
	<div [@toShow]="items.length" *ngIf="isShow">
 		 <div *ngFor="let item of items">
    		{{ item }}
  		</div>
	</div>
  `,
  animations: [
    trigger('toShow', [
      transition('*=>*', [
          //在Angular控制的显示隐藏下，元素会被自动添加上:enter或:leave选择器
          //但是只会添加在被控制的元素之上
          //以这个例子来说，就是只能添加在父盒子上，子盒子就不能通过:enter去获取，也就无法实现交错效果
          //但是如果添加 { optional: true },就可以同时检测到子盒子的变化
        query(
          ':enter',
          [
             //初态
            style({ opacity: 0 }),
              //定义延时和终态
            stagger(200, [animate('0.5s', style({ opacity: 1 }))]),
          ],
            
          { optional: true },
        ),
      ]),
    ]),
  ],
})
class demo {
  isShow = true;
    items=['1','2','3','4']
    toggle(){
        this.isShow = !this.isShow
    }
}
~~~

### angular原理

#### 挂载器

~~~ts
//我们在main.ts中可以看到以下写法
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
//platformBrowserDynamic和bootstrapModule到底做了什么呢？
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
~~~

我们一点一点来结构吧。。

~~~ts
//首先platformBrowserDynamic方法为
const platformBrowserDynamic = createPlatformFactory(
    platformCoreDynamic, 'browserDynamic', INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS);

//先解读一下createPlatformFactory方法
//其实就是一个平台创建函数
//从代码来看很容易看出这是单例模式
function createPlatformFactory(
    parentPlatformFactory: ((extraProviders?: StaticProvider[]) => PlatformRef)|null, name: string,
    providers: StaticProvider[] = []): (extraProviders?: StaticProvider[]) => PlatformRef {
        
        //首先创建了名字，并且生成了一个注入器，这两步骤主要是做一个标识
  const desc = `Platform: ${name}`;
  const marker = new InjectionToken(desc);
        
        //返回一个函数
  return (extraProviders: StaticProvider[] = []) => {
      //获取平台
    let platform = getPlatform();
      //如果是没有平台的情况下，就进入创建平台的逻辑
    if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
        
        //收集provider
      const platformProviders: StaticProvider[] = [
        ...providers,       //
        ...extraProviders,  //
        {provide: marker, useValue: true}
      ];
        
        //如果有传入平台工厂则将注入传入，并执行，以此创建平台，平台会写在单例上
      if (parentPlatformFactory) {
        parentPlatformFactory(platformProviders);
      } else {
          
          //如果没传入平台工厂则创建一个再执行，以此创建平台，平台会写在单例上
        createPlatform(createPlatformInjector(platformProviders, desc));
      }
    }
      //到这一步就是暴露出平台了
    return assertPlatform(marker);
  };
}

//其实就是一个平台工厂
const platformCoreDynamic = createPlatformFactory(platformCore, 'coreDynamic', [
  {provide: COMPILER_OPTIONS, useValue: {}, multi: true},
  {provide: CompilerFactory, useClass: JitCompilerFactory, deps: [COMPILER_OPTIONS]},
]);


//硬性注入器，即默认就有的注入器，到时会和用户自定义注入器合并
const INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS: StaticProvider[] = [
  INTERNAL_BROWSER_PLATFORM_PROVIDERS,
  {
    provide: COMPILER_OPTIONS,
    useValue: {providers: [{provide: ResourceLoader, useClass: ResourceLoaderImpl, deps: []}]},
    multi: true
  },
  {provide: PLATFORM_ID, useValue: PLATFORM_BROWSER_ID},
];

//创建平台的函数做了什么呢？
//就是创建了一个单例平台，使得getPlatform()能够得到该单例
function createPlatform(injector: Injector): PlatformRef {
  if (_platformInjector && !_platformInjector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
    throw new RuntimeError(
        RuntimeErrorCode.MULTIPLE_PLATFORMS,
        ngDevMode &&
            'There can be only one platform. Destroy the previous one to create a new one.');
  }
  publishDefaultGlobalUtils();
  publishSignalConfiguration();
  _platformInjector = injector;
  const platform = injector.get(PlatformRef);
  runPlatformInitializers(injector);
  return platform;
}

//assertPlatform主要进行单例平台正确验证，错误则报错，正确再把平台暴露出来
function assertPlatform(requiredToken: any): PlatformRef {
  const platform = getPlatform();

  if (!platform) {
    throw new RuntimeError(RuntimeErrorCode.PLATFORM_NOT_FOUND, ngDevMode && 'No platform exists!');
  }

  if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
      !platform.injector.get(requiredToken, null)) {
    throw new RuntimeError(
        RuntimeErrorCode.MULTIPLE_PLATFORMS,
        'A platform with a different configuration has been created. Please destroy it first.');
  }

  return platform;
}

//这个是和createPlatform搭配使用的，主要是创建一个平台注入器
function createPlatformInjector(providers: StaticProvider[] = [], name?: string): Injector {
  return Injector.create({
    name,
    providers: [
      {provide: INJECTOR_SCOPE, useValue: 'platform'},
      {provide: PLATFORM_DESTROY_LISTENERS, useValue: new Set([() => _platformInjector = null])},
      ...providers
    ],
  });
}
~~~

大致流程我们已经看完了，做了那么多工作其实返回的就是一个platform，那么什么是platform呢？

其实platform就是一个注入器，注入器的结构：

~~~js
{
    records, //providers经过转换被存储在这，可以通过get方法获取到provider实例
    injectorDefTypes,
}
~~~

到这里我们大概能形成依赖注入的概念，依赖以树形结构依附在platform这个注入器上，并且由于是单例，所以可以实现互相引用

接下来我们来看看bootstrapModule。。。

~~~ts
//首先我们需要明确，我们执行了platformBrowserDynamic()之后所得的是一个platform
//而这个platform是injector.get(platformRef)的结果
//platformRef里就包含了bootstrapModule方法
//而injector.get(platformRef)实际上就是把platformRef作为依赖放入records中了
//通过一系列操作会在platform实例上添加上platformRef的各种属性，所以bootstrapModule才能被使用
//其实就类似与vue2的扁平化处理，被监听的数据都会在组件实例上暴露
~~~

~~~ts
//bootstrapModule主要做了什么呢？
//返回了一个解析器
 bootstrapModule<M>(
      moduleType: Type<M>,
      compilerOptions: (CompilerOptions&BootstrapOptions)|
      Array<CompilerOptions&BootstrapOptions> = []): Promise<NgModuleRef<M>> {
    const options = optionsReducer({}, compilerOptions);
    return compileNgModuleFactory(this.injector, options, moduleType)
        .then(moduleFactory => this.bootstrapModuleFactory(moduleFactory, options));
}
//解析器主要就是将递归去解析各个组件，将用户代码->AST->界面视图代码
~~~
