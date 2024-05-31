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

### ng-deep

> ng-deep是angular中一个非常好用的css选择器

ng-deep的主要作用是深度控制，即能够控制子组件内部的css选择器

~~~css
/** 比如子组件内部 **/
h1 {
    color: red
}
/** 那么我们即使在父组件中写同样的选择器，也不会对子组件内部的选择器有任何影响 **/
/** 但如果这样写 **/
::ng-deep h1 {
    color: yellow
}
/** 子组件的选择器就可以被父组件的选择器覆盖 **/
~~~



不过由于其特性，容易造成全局污染，所以一般与:host搭配使用，host表示的就是只在组件范围内生效，类似vue的scoped

> 单独使用ng-deep这种做法已经被angular官方废弃

~~~css
/** 用法 **/
/** 假设我们需要对ant组件的分页器进行自定义控制，可以这样写 **/
:host ::ng-deep .ant-pagination{
    
}
~~~

### 自定义指令

#### 属性型指令

##### 基础写法

~~~ts
import { Directive, ElementRef } from '@angular/core';

//对于一个指令，我们需要明确几个结构
//第一个选择器
@Directive({
    //当我们在某个dom元素上添加appHighlight属性，就代表其绑定上了该指令
  selector: '[appHighlight]'
})
export class HighlightDirective {
    //绑定之后，constructor会被注入宿主元素
    //我们接收之后就可以进行操作了
    constructor(private el: ElementRef) {
       this.el.nativeElement.style.backgroundColor = 'yellow';
    }
}
~~~

~~~html
<p appHighlight>Highlight me!</p>
~~~

##### 处理用户事件

~~~ts
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {

  constructor(private el: ElementRef) { }

    //利用HostListener可以添加用户事件
  @HostListener('mouseenter') onMouseEnter() {
    this.highlight('yellow');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight('');
  }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }

}
~~~

![](.\images\highlight-directive-anim.gif)

##### 指令传值

~~~ts
import { Directive, ElementRef, HostListener, Input } from '@angular/core';
@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
	//通过@Input实现传值
  @Input() appHighlight = '';
    
  constructor(private el: ElementRef) { }

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.appHighlight);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight('');
  }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }

}
~~~

~~~html
<p [appHighlight]="'yellow'">Highlight me!</p>
~~~

#### 结构型指令

> 像\*ngIf、\*ngFor这样的指令就是结构型指令

首先我们需要知道结构型指令的第二个用法，就是与ng-template搭配使用的用法

ngIf:

~~~html
<ng-template [ngIf]="hero">
  <div class="name">{{hero.name}}</div>
</ng-template>

<!-- 他的作用就类似下面 -->
<div *ngIf="hero" class="name">{{hero.name}}</div>

<!-- 并且ng-template也不会被渲染，只有内容会被渲染 -->
~~~

ngFor:

~~~html
<ng-template ngFor let-hero [ngForOf]="heroes"
  let-i="index" let-odd="odd" [ngForTrackBy]="trackById">
  <div [class.odd]="odd">
    ({{i}}) {{hero.name}}
  </div>
</ng-template>

<!-- 他的作用就类似下面 -->
<div
  *ngFor="let hero of heroes; let i=index; let odd=odd; trackBy: trackById"
  [class.odd]="odd">
  ({{i}}) {{hero.name}}
</div>
~~~

来看看自定义结构型指令：

~~~ts
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[appUnless]'})
export class UnlessDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef) { }

    
    //接收的参数是标签属性里传入的参数
    //由逻辑可以看出这是一个与ngif相反的指令
  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
~~~

对于依赖注入的templateRef和viewContainer，angular官方是这样说的：

> `UnlessDirective` 会通过 Angular 生成的 `<ng-template>` 创建一个[嵌入的视图](https://angular.cn/api/core/EmbeddedViewRef)，然后将该视图插入到该指令的原始 `<p>` 宿主元素紧后面的[视图容器](https://angular.cn/api/core/ViewContainerRef)中。

简单的说，被绑定该指令的dom并不会显示，而是angular会自动在该dom后添加一个viewContainer，并将dom转换成template，如果本身就是template就不需要转换，通过依赖注入传给指令，然后根据condition去进行viewContainer内的视图添加和删除

~~~html
<hr>

<h2 id="appUnless">UnlessDirective</h2>
<p>
  The condition is currently
  <span [ngClass]="{ 'a': !condition, 'b': condition, 'unless': true }">{{condition}}</span>.
  <button
    type="button"
    (click)="condition = !condition"
    [ngClass] = "{ 'a': condition, 'b': !condition }" >
    Toggle condition to {{condition ? 'false' : 'true'}}
  </button>
</p>

<p *appUnless="condition" class="unless a">
  (A) This paragraph is displayed because the condition is false.
</p>

<p *appUnless="!condition" class="unless b">
  (B) Although the condition is true,
  this paragraph is displayed because appUnless is set to false.
</p>


<h4>UnlessDirective with template</h4>

<p *appUnless="condition">Show this sentence unless the condition is true.</p>

<p *appUnless="condition" class="code unless">
  (A) &lt;p *appUnless="condition" class="code unless"&gt;
</p>

<ng-template [appUnless]="condition">
  <p class="code unless">
    (A) &lt;ng-template [appUnless]="condition"&gt;
  </p>
</ng-template>

<hr />
~~~

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
          //但是只会添加在被ng指令控制的元素之上（*ngIf、*ngFor、viewContainerRef）
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

### 视图

> angular将dom进行抽象，创造出了视图的概念，我们创建的dom、components在angular内都可以被看作各种各样的视图
>
> 视图的表现形式是什么呢？下面是angular封装的一些视图类：
>
> - ElementRef
> - TemplateRef
> - ViewRef
> - ViewContainerRef

下面我们将分别介绍每一个视图及其应用

#### ElementRef

ElementRef是最基本的抽象，它的结构内只有一个属性，nativeElement，一般我们访问dom都是通过这种方式

#### TemplateRef

故名思意，其主要获取的是\<template>\</template>标签

有过框架开发经验的都知道，template标签他只会把内容渲染出来，template则不会被渲染，这种渲染方式有利于减少dom节点的冗余

TemplateRef在angular中的使用方式：

~~~ts
//我们直接在模板中使用ng-template是不会显示在页面上的
//具体使用还需看后续介绍

@Component({
    selector: 'sample',
    template: `
        <ng-template #tpl>
            <span>I am span in template</span>
        </ng-template>
    `
})
export class SampleComponent implements AfterViewInit {
    @ViewChild("tpl") tpl: TemplateRef<any>;

    ngAfterViewInit() {
        let elementRef = this.tpl.elementRef;
        // outputs `<!--container-->`
        console.log(elementRef.nativeElement);
    }
}
//输出表示，angular删除了dom中的template标签，并且输出<!--container-->注释
~~~

#### ViewRef

在angular中，ViewRef表示angular视图的抽象，在angular的世界中，view是应用程序的基本构建块，它是在一起被创建或者销毁的最小元素单元。angular开发者鼓励将UI界面看作view的聚合而非dom树。

Angular支持两种View：

- EmbeddedView，指TemplateRef
- HostView，指ComponentRef

~~~ts
//创建EmbeddedView

let view = this.tpl.createEmbeddedView(null);
//这样我们就创建了一个视图，具体使用请往后看
~~~

~~~ts
//创建HostView
//首先需要自己创一个testComponent，这里我就不演示了

constructor(private injector: Injector,
            private r: ComponentFactoryResolver) {
    let factory = this.r.resolveComponentFactory(testComponent);
    let componentRef = factory.create(injector);
    let view = componentRef.hostView;
}
~~~

#### ViewContainerRef

用于容纳一个或多个view的容器，前面我们讲了如何创建EmbeddedView、HostView，但也只是停留在创建之上，我们要如何使它们在页面中显示出来呢？这时ViewContainerRef的作用就体现出来了

首先需要提醒的是，任何 DOM 元素都可以作为 View 的容器。有趣的是，Angular 不是将 View 插入到元素中，而是绑定到元素的 ViewContainer 中。这类似于 router-outlet 如何插入 Component。

通常，比较好的将一个位置标记为 ViewContainer 的方式，是创建一个 \<ng-container> 元素。它会被渲染为一条 comment，所以不会带来多于的 HTML 元素到 DOM 中。下面是一个示例，演示了在 Component 的模板中创建 ViewContainer。

~~~ts
//我们先搭建好模板
@Component({
  selector: 'app-root',
  template: `
        <span>I am first span</span>
        <ng-container #vc></ng-container>
        <span>I am last span</span>
    `,
})
export class AppComponent {
  @ViewChild("vc", { read: ViewContainerRef }) vc!: ViewContainerRef;

  ngAfterViewInit(): void {
    // outputs `<!-- ng-container -->`
    console.log(this.vc.element.nativeElement);
  }
}
//用这种方式添加就不会造成dom冗余

//接下来我们添加试图吧
//首先我们需要知道ViewContainerRef的接口
class ViewContainerRef {
    ...
    clear() : void  //清除所有视图
    insert(viewRef: ViewRef, index?: number) : ViewRef  //插入视图
    get(index: number) : ViewRef  //获取视图
    indexOf(viewRef: ViewRef) : number  //查找下标
    detach(index?: number) : ViewRef  //拆除视图
    move(viewRef: ViewRef, currentIndex: number) : ViewRef  //移动视图
}
~~~

~~~ts
//首先我们先试试EmbeddedView

@Component({
  selector: 'app-root',
  template: `
        <span>I am first span</span>&nbsp;
        <ng-container #vc></ng-container>&nbsp;
        <span>I am last span</span>
        <ng-template #tpl>
            <span>I am span in template</span>
        </ng-template>
    `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild("vc", { read: ViewContainerRef }) vc!: ViewContainerRef;
  @ViewChild("tpl") tpl!: TemplateRef<any>;

  ngAfterViewInit(): void {
    // outputs `template bindings={}`
    let view = this.tpl.createEmbeddedView(null);
    this.vc.insert(view);
  }
}
~~~

页面中终于能体现出template了!

![](.\images\QQ截图20231020135913.png)

~~~ts
//再试试hostview

@Component({
  selector: 'app-root',
  template: `
        <span>I am first span</span>&nbsp;
        <ng-container #vc></ng-container>&nbsp;
        <span>I am last span</span>
    `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild("vc", { read: ViewContainerRef }) vc!: ViewContainerRef;
  view: any = null

  ngAfterViewInit(): void {
    // outputs `template bindings={}`
    this.vc.insert(this.view);
  }
  constructor(private injector: Injector,
    private r: ComponentFactoryResolver) {
    let factory = this.r.resolveComponentFactory(TestComponent);
    let componentRef = factory.create(injector);
    this.view = componentRef.hostView;
  }
}
~~~

效果如下：

![](.\images\QQ截图20231020140451.png)

> 到这里为止，我们应该能明白angular的视图机制了

我们来看看用ng-container和普通dom节点创建视图有什么区别

这是利用ng-container创建的：

![](.\images\QQ截图20231020140930.png)

这是利用dom创建的：

![](.\images\QQ截图20231020141041.png)

我们可以发现下面相比上面多了一个div标签，可以证明ng-container不会产生冗余dom节点，并且我们可以看到，视图的添加并不是在viewcontainer内部的，而是在其下方，这就可以解释:

> 有趣的是，Angular 不是将 View 插入到元素中，而是绑定到元素的 ViewContainer 中。

#### 简单的添加视图

> 如果每次创建视图都要用那么多方法，实现起来实在是太繁琐了，angular的开发者当然也想到这一点，于是提供了一种便捷的添加视图的方法

- ngTemplateOutlet
- ngComponentOutlet

##### ngTemplateOutlet

> 故名思意，就是创建并添加template的视图

~~~ts
//我们之前不是尝试过直接在模板中添加template标签吗，然后发现不能在页面显示，但是按照下面的写法就可以了
@Component({
  selector: 'app-root',
  template: `
        <span>I am first span</span>
        <ng-container [ngTemplateOutlet]="tpl"></ng-container>
        <span>I am last span</span>
        <ng-template #tpl>
            <span>I am span in template</span>
        </ng-template>
    `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
}
//或者不使用ng-container而使用普通dom节点
@Component({
  selector: 'app-root',
  template: `
        <span>I am first span</span>
        <dom [ngTemplateOutlet]="tpl"></dom>
        <span>I am last span</span>
        <ng-template #tpl>
            <span>I am span in template</span>
        </ng-template>
    `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
}
~~~

##### ngComponentOutlet

~~~ts
@Component({
  selector: 'app-root',
  template: `
        <span>I am first span</span>
        <ng-container *ngComponentOutlet="TestComponent"></ng-container>
        <span>I am last span</span>
    `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  TestComponent = TestComponent
}
//其实执行逻辑就是之前编程式添加的逻辑
~~~

#### 总结

看到这里我们应该可以理解angular的view驱动，angular模板中的一切都被看做是视图，普通的dom节点是ElementRef，template模板是templateRef

普通节点angular在初始化的过程就帮助创建视图了，而template这种标签是需要给它进行视图化并插入视图容器中，才能在页面显示

但是对于component，如果直接在页面中使用，angular会自动进行渲染，但是如果要通过视图的方式，也可以进行渲染，底层的原理都是一样的，都是经历了视图化再插入到视图容器中

### 动态创建组件-portals

> 视图容器中插入视图貌似已经实现了动态创建组件、template的功能，但是似乎仍有不足：视图间无法相互输入输出
>
> 这时angular官方提供了一套开发工具Component Dev Kit (CDK)->@angular/cdk/portal，内涵portal来辅助动态组件的生成

portal的三种形态：

- ComponentPortal
- TemplatePortal
- DomPortal

> 它们三个的泛型基类是Portal<T>，有三种方法：
>
> - attach（挂载到容器）
> - detach（从容器移除）
> - isAttached（判断视图是否是挂载状态）

相比原生（componentFactory），portal创建动态组件更简单：

~~~ts
//ComponentPortal
this.componentPortal = new ComponentPortal(ExampleComponent);
~~~

~~~ts
//templatePortal
this.templatePortal = new TemplatePortal(this.testTemplate)
~~~

~~~ts
//domPortal
this.domPortal = new DomPortal(this.domPortal);
~~~

### 内容投影

> 内容投影在vue中类似插槽，即在组件标签中插入标签

内容投影分为三种：

- 单槽内容投影
- 多槽内容投影
- 条件内容投影

#### 单槽内容投影

~~~ts
//首先我们需要创造一个容器，即在组件插入的标签会显示的位置
//就类似vue的slot，在angular中是<ng-content></ng-content>
import { Component } from '@angular/core';

@Component({
  selector: 'app-zippy-basic',
  template: `
    <h2>可以接收投影的组件</h2>
    <ng-content></ng-content>
  `
})
export class ZippyBasicComponent {}
~~~

~~~html
<app-zippy-basic>
  <p>投影的内容</p>
</app-zippy-basic>
~~~

效果图

![](.\images\Snipaste_2023-10-22_13-42-36.png)

#### 多槽内容投影

~~~ts
//多槽顾名思义，就是可以投影多个内容
//但不止这个，多槽还能控制投影出现的位置，可以通过<ng-content> 的 select 属性来完成此任务
import { Component } from '@angular/core';

@Component({
  selector: 'app-zippy-multislot',
  template: `
    <h2>多槽内容投影</h2>

    Default:
    <ng-content></ng-content>
	<!-- 例如这个 -->
    Question:
    <ng-content select="[question]"></ng-content>
  `
})
export class ZippyMultislotComponent {}
~~~

~~~html
<app-zippy-multislot>
    <!-- 添加上question属性，作用就类似于vue的具名插槽 -->
  <p question>
    Is content projection cool?
  </p>
  <p>Let's learn about content projection!</p>
</app-zippy-multislot>
~~~

效果图：

![](.\images\Snipaste_2023-10-22_13-47-44.png)

当然，我们不能被误导一个\<ng-content>\</ng-content>只能接收一个标签，其实它可以接收任意数量的标签：

~~~html
<app-zippy-multislot>
    <!-- 添加上question属性，作用就类似于vue的具名插槽 -->
    <p question>
    Is content projection cool?
    </p>
    <p question>Let's learn about content projection!</p>
    <p>Let's learn about content projection!</p>
    <p>Let's learn about content projection!</p>
</app-zippy-multislot>
~~~

效果图：

![](.\images\Snipaste_2023-10-22_13-51-51.png)

> 需要注意，投影只会以父组件的样式为基础生效，在子组件（被投影组件）中是无法写投影的样式的

#### 有条件的内容投影

~~~ts
//example-zippy.template.ts
import { Component, Directive, Input, TemplateRef, ContentChild, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: 'button[appExampleZippyToggle]',
})
export class ZippyToggleDirective {
  @HostBinding('attr.aria-expanded') ariaExpanded = this.zippy.expanded;
  @HostBinding('attr.aria-controls') ariaControls = this.zippy.contentId;
  @HostListener('click') toggleZippy() {
    this.zippy.expanded = !this.zippy.expanded;
  }
  constructor(public zippy: ZippyComponent) {}
}

let nextId = 0;

@Directive({
  selector: '[appExampleZippyContent]'
})
export class ZippyContentDirective {
  constructor(public templateRef: TemplateRef<unknown>) {}
}

@Component({
  selector: 'app-example-zippy',
  templateUrl: 'example-zippy.template.html',
})
export class ZippyComponent {
  contentId = `zippy-${nextId++}`;
  @Input() expanded = false;
    //用于接收外部传来的template，只能接收一个，@ContentChildren能接收多个
  @ContentChild(ZippyContentDirective) content!: ZippyContentDirective;
}
~~~

~~~html
<!-- app.component.html -->
<app-example-zippy>
  <button type="button" appExampleZippyToggle>Is content project cool?</button>
  <ng-template appExampleZippyContent>
    It depends on what you do with it.
  </ng-template>
</app-example-zippy>
~~~

~~~html
<!-- example-zippy.template.html -->
<ng-content></ng-content>
<div *ngIf="expanded" [id]="contentId">
    <ng-container [ngTemplateOutlet]="content.templateRef"></ng-container>
</div>
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

我们一点一点来解构吧。。

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

#### 依赖注入

待更新中。。。
