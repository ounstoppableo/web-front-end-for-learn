### 导读

本篇文章属于typescript高级用法合集中的一个小节，typescript高级用法合集中包含了对泛型、声明、模块、命名空间等高级用法的详细解读，非常利于提升typescript使用理解和进阶提升。

[点我去到typescript高级用法合集页~]()

### 泛型的定义方法

我们都知道泛型是放在''<''">"中的，一般什么情况下可以使用泛型呢？

- 对象类型，实际上也就是typescript里面的函数。

  ~~~ts
  interface A<T> {
  	a: T
  }
  type B<T> = {
      b: T
  }
  ~~~

- 函数

  - 常规函数

    ~~~ts
    function A<T>(arg: T):T{
        return arg
    }
    ~~~

  - 箭头函数

    ~~~ts
    const A: <T>(arg: T)=>T = (arg) => arg
    ~~~

- 类

  ~~~ts
  class A<T> {
    a: T;
    b: (x: T, y: T) => T;
  }
  ~~~

### 泛型值的确定方式

- 显式传值

  以上三种定义方式都可以显示传值：

  ~~~ts
  interface A<T> {
  	a: T
  }
  type a = A<number>
  ~~~

  ~~~ts
  function A<T>(arg: T):T{
      return arg
  }
  A<number>(1)
  ~~~

  ~~~ts
  class A<T> {
    a: T;
    b: (x: T, y: T) => T;
  }
  new A<number>()
  ~~~

- 隐式传值

  只有函数可以进行隐式传值，也就是让typescript自动进行类型推断：

  ~~~ts
  function A<T>(arg: T):T{
      return arg
  }
  A(1) // 此时T为number
  ~~~

### 泛型的约束

在泛型中我们利用`extends`来进行值约束，比如：

~~~ts
interface Lengthwise {
  length: number;
}
 
function loggingIdentity<Type extends Lengthwise>(arg: Type): Type {
  console.log(arg.length);
  return arg;
}
~~~

约束的含义即是左侧的值要**属于**右侧值的子类型。

### 泛型的方差注释

一般来说方差是typescript自动推断的结果，方差的推断可以保证**子类型被父类型安全使用(协变)**或**父类型被子类型安全接收(逆变)**。

#### 协变（out）

如果类型 `A` 是类型 `B` 的子类型，并且 `F<A>` 也是 `F<B>` 的子类型，则称泛型 `F` 对该参数是协变的。比如：

~~~ts
class Animal {}
class Dog extends Animal {}

let animals: Animal[] = [new Dog()]; // 协变，允许赋值
~~~

#### 逆变（in）

如果类型 `A` 是类型 `B` 的子类型，但 `F<B>` 是 `F<A>` 的子类型，则称泛型 `F` 对该参数是逆变的。比如：

~~~ts
type Printer<T> = (value: T) => void;

let printAnimal: Printer<Animal> = (animal) => console.log(animal);
let printDog: Printer<Dog> = printAnimal; // 逆变，允许赋值
~~~

### 综合实例

我们可以将下面代码进行简化：

~~~ts
declare function create(): Container<HTMLDivElement, HTMLDivElement[]>;
declare function create<T extends HTMLElement>(element: T): Container<T, T[]>;
declare function create<T extends HTMLElement, U extends HTMLElement>(
  element: T,
  children: U[]
): Container<T, U[]>;
~~~

简化后：

~~~ts
declare function create<T extends HTMLElement = HTMLDivElement, U extends HTMLElement[] = T[]>(
  element?: T,
  children?: U
): Container<T, U>;
~~~

其中泛型也可以通过`=`进行默认值确定。

### 参考文献

[typescript文档——Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

