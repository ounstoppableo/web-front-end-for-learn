### 导读

本篇文章属于typescript高级用法合集中的一个小节，typescript高级用法合集中包含了对泛型、声明、模块、命名空间等高级用法的详细解读，非常利于提升typescript使用理解和进阶提升。

[点我去到typescript高级用法合集页~]()

### typescript类型操作

typescript的类型中使用type进行定义，就像javascript中的const、let、function一样。

比如：

~~~ts
type num = number;

// 我们也可以利用type定义类型函数
type fn<T> = T;
~~~

我们一定要严格区分出`类型`和`值`，这是学习typescript的基础。

其实有个简单的方法，能被console.log打印的就是`值`，不能被打印的就是`类型`，类型只存在于编译前，编译后会被融合进javascript中，这也是其不能被打印的原因。

#### keyof运算

keyof用于生成`对象类型`的`键的字符串或数字文字联合`，比如：

~~~ts
type Point = { x: number; y: number };
type P = keyof Point;
~~~

其中`type P = "x" | "y"`。

如果x或y具有类型签名，那么keyof将会返回其类型声明：

~~~ts
type Point = { [x:number]: number; [y:string]: number };
type P = keyof Point;
~~~

其中`type P = "number" | "string"`。

**注意**：很多初学者都会犯一个错误，就是误把keyof用于给对象使用了，实际上keyof是针对类型有效的。

#### typeof运算

typeof运算符是最容易被初学者搞混的，因为javascript中也有typeof。

在弄清楚typescript中的typeof之前，我们先弄清javascript里的typeof：

javascript中的typeof的值有8种：

- undefined
- boolean
- number
- bigint
- string
- symbol
- object
- function

而typescript中typeof可以在javascript的typeof的基础上获得更细节的类型（针对引用数据类型而言），比如：

~~~ts
const obj = {x:1 , y:'2'}
type P = typeof obj;
~~~

此时的`P = { x : number , y : string }`。

typescript和javascript最大的区别是什么呢？

typescript的值不能被console.log打出(实际上打出的是javascript的值)，而javascript可以。举个例子：

~~~ts
const obj = {x:1 , y:'2'};
console.log(typeof obj); // object
~~~

这里我们可以知道typescript其实底层还是基于javascript的typeof类型的，它只是将类型进一步细化，并没有创造出新的类型。

换句话说，**typescript的类型实际上是不在真实环境中存在的，而是在编译时作为一个提示而已**。

这也是初学者很容易被误导的地方，总是认为它们是真实存在的值，像是java或c++一样，但是typescript的值只存在于编译前，这也体现了typescript的最大使用特征：**仅仅是用于规范代码编写**。

我们不需要给typescript再赋予更多职能了。

#### 索引访问类型

type的使用其实和const、let类似，也拥有对象索引功能，只不过type索引的是类型：

~~~ts
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"];
~~~

其中`Age = number`。

千万不能用混了：

~~~ts
const person = { age: 1, name: '2', alive: true };
type Age = Person["age"]; //这个用法是错的
~~~

针对上述情况我们可以先利用typeof将值转换成type即可：

~~~ts
const person = { age: 1, name: '2', alive: ture };
type Person = typeof person;
type Age = Person["age"]; // number
~~~

#### 条件类型

条件类型的语法：

~~~
SomeType extends OtherType ? TrueType : FalseType;
~~~

整体来看有点类似三元运算符，只不过还引入了extends，那么这个extends是做什么的呢？

我们不应该将typescript的extends联想成javascript类里的extends，可以说它们毫无关系。

在typescript中，extends会在两个地方出现：

- 泛型中：用于约束
- 条件类型中：用于比较

泛型现在先不谈，在条件类型中，extends表示将左侧的类型与右侧的类型做比较（或者说分配），我们只要粗浅的将此时的extends等价成类型的===运算符即可。

我们来看看条件类型的具体用法：

~~~ts
type Flatten<T> = T extends any[] ? T[number] : T;
 
// Extracts out the element type.
type Str = Flatten<string[]>;
     
type Str = string
 
// Leaves the type alone.
type Num = Flatten<number>;

// Flatten是一个数组类型展平功能的类型函数
~~~

>  上面提到了一个T[number]的用法，T代表的是数组，我们不能把它解读成string\[][number]，应该解读成string[number]。
>
> 而string[number]其实就是索引访问类型，在对象类型的索引访问类型中可能还需要像Person["age"]这样指定具体的key，但是对于数组中所有键的类型都是保持一致的，我们就可以直接使用number代替index索引去取数组类型的值类型。

##### 条件类型内的类型推断

在条件类型内我们可以使用`infer`来进行类型推断，比如我们可以将上述Flatten类型函数改写成：

~~~ts
type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;
~~~

我们可以想象infer就类似const、let，后面紧跟的是一个变量，而上述Item就属于Array数组下内部类型的类型变量。

实际上infer不止用于条件类型，但是其用法都是类似的。

#### 映射类型

映射类型用于在对象类型中消除重复定义，比如：

~~~ts
type OnlyBoolsAndHorses = { // 这是一个映射类型
  [key: string]: boolean | Horse;
};
 
const conforms: OnlyBoolsAndHorses = {
  del: true,
  rodney: false,
};
~~~

##### 映射类型与泛型结合

我们也可以将**映射类型与泛型结合**使用：

~~~ts
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
type Features = {
  darkMode: () => void;
  newUserProfile: () => void;
};
type FeatureOptions = OptionsFlags<Features>;
~~~

在这里我们看到一个新的关键字：`in keyof`，我们学过keyof，知道他能拿到对象类型键值的联合类型，在这里也就是能拿到`"darkMode" | "newUserProfile"`，而in就类似于遍历效果，最终结果为：

`FeatureOptions = { darkMode: boolean; newUserProfile: boolean; }`

如果`in keyof`针对的是一个带有签名的键又如何呢？

~~~
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
type Features = {
  [darkMode:string]: () => void;
  [newUserProfile:number]: () => void;
};
type FeatureOptions = OptionsFlags<Features>;
~~~

结果：`FeatureOptions = { [x:string]: boolean; {x:number}: boolean; }`

实际上如果这样定义，darkMode和newUserProfile具体是什么就不重要了，所以typescript利用x来代替。

##### 映射修饰符

映射修饰符有：

- readonly：属性变为只读
- ?：表示可选

修饰符又存在前缀：

- +：默认值
- -：表示删除修饰符

具体用法：

~~~ts
type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};
 
type LockedAccount = {
  readonly id: string;
  readonly name: string;
};
 
type UnlockedAccount = CreateMutable<LockedAccount>;
~~~

此时` UnlockedAccount = { id: string; name: string; }`

~~~ts
type Concrete<Type> = {
  [Property in keyof Type]-?: Type[Property];
};
 
type MaybeUser = {
  id: string;
  name?: string;
  age?: number;
};
 
type User = Concrete<MaybeUser>;
~~~

此时`User = { id: string; name: string; age: number; }`

##### as关键字

as类似于给映射的字段重新赋值，就类似于javascript中的解构：

~~~js
const obj = {a:1};
const {a:b} = obj;
console.log(b); // 1
~~~

as的作用就类似于{a:b}中的`:`。

我们举个例子：

~~~ts
type Getters<Type> = {
    [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property]
};
 
interface Person {
    name: string;
    age: number;
    location: string;
}

type LazyPerson = Getters<Person>;
~~~

此时：`LazyPerson = { getName: () => string; getAge: () => number; getLocation: () => string; }`

我们也可以利用as指向never来进行字段的过滤，比如：

~~~ts
type RemoveKindField<Type> = {
    [Property in keyof Type as Exclude<Property, "kind">]: Type[Property]
};
 
interface Circle {
    kind: "circle";
    radius: number;
}
 
type KindlessCircle = RemoveKindField<Circle>;
~~~

此时：`KindlessCircle = { radius: number; }`

在映射类型中，除了`in keyof`关键字外还有`in`关键字，其中`in`关键字拿到的就是一个完整的类型了，不过需要搭配`as`才能使用，比如：

~~~ts
type EventConfig<Events extends { kind: string }> = {
    [E in Events as E["kind"]]: (event: E) => void;
}
 
type SquareEvent = { kind: "square", x: number, y: number };
type CircleEvent = { kind: "circle", radius: number };
 
type Config = EventConfig<SquareEvent | CircleEvent>
~~~

此时，`Config = { square: (event: SquareEvent) => void; circle: (event: CircleEvent) => void; }`

#### 模板文字类型

在上一个小节我们已经使用过了模板文字类型，现在来具体讲讲模板文字类型的用法：

~~~ts
type World = "world";
type Greeting = `hello ${World}`;
~~~

此时，`Greetings= hello world`。

其也可以和联合类型联合使用：

~~~ts
type EmailLocaleIDs = "welcome_email" | "email_heading";
type FooterLocaleIDs = "footer_title" | "footer_sendoff";
 
type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
~~~

此时，`AllLocaleIDs = "welcome_email_id" | "email_heading_id" | "footer_title_id" | "footer_sendoff_id"`。

我们来看一个综合实例：

~~~ts
type PropEventSource<Type> = {
    // Key extends string & keyof Type表示Key必须是string且为Type泛型的键
    on<Key extends string & keyof Type> 
        (eventName: `${Key}Changed`, callback: (newValue: Type[Key]) => void): void;
};
 
declare function makeWatchedObject<Type>(obj: Type): Type & PropEventSource<Type>;
 
const person = makeWatchedObject({
  firstName: "Saoirse",
  lastName: "Ronan",
  age: 26
});
 
person.on("firstNameChanged", newName => {
                           // typeof newName = string
    console.log(`new name is ${newName.toUpperCase()}`);
});
 
person.on("ageChanged", newAge => {
    				 // typeof newAge = number
    if (newAge < 0) {
        console.warn("warning! negative age");
    }
})
~~~

### typescript类型工具函数

- Awaited\<type>

  该函数用于解开Promise，比如：

  ~~~ts
  type A = Awaited<Promise<string>>
  ~~~

  此时，` A = string`。

  实现：

  ~~~ts
  type Awaited<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U extends PromiseLike<any> ? Awaited<U> : U : never;
  ~~~

- Partial\<type>

  将type的属性变为可选，比如：

  ~~~ts
  interface Todo {
    title: string;
    description: string;
  }
  type A = Partial<Todo>
  ~~~

  此时，`A = { title? : string , description? : string }`。

  实现：

  ~~~ts
  type Partial<T extends object> = {
      [key in keyof T]?: T[key]
  } 
  ~~~

- Required\<Type>

  将type的属性变为必填，比如：

  ~~~ts
  interface Todo {
    title?: string;
    description?: string;
  }
  type A = Required<Todo>
  ~~~

  此时，`A = { title : string , description : string }`。

  实现：

  ~~~ts
  type Required<T extends object> = {
      [key in keyof T]-?: T[key]
  } 
  ~~~

- Readonly\<Type>

  把属性变为只读，比如：

  ~~~ts
  interface Todo {
    title: string;
  }
   
  const todo: Readonly<Todo> = {
    title: "Delete inactive users",
  };
   
  todo.title = "Hello"; // ts类型报错，因为只读
  ~~~

  实现：

  ~~~ts
  type Readonly<T extends object> = {
      readonly [key in keyof T]: T[key]
  } 
  ~~~

- Record\<Type>

  构造一个属性键为 `Keys` 且属性值为 `Type` 的对象类型，比如：

  ~~~ts
  type CatName = "miffy" | "boris" | "mordred";
   
  interface CatInfo {
    age: number;
    breed: string;
  }
  type A = Record<CatName, CatInfo>
  ~~~

  此时，`A = { miffy:CatInfo , boris:CatInfo , mordred:CatInfo }`。

  实现：

  ~~~ts
  type Record<K extends string, T extends any> = {
      K: T
  } 
  ~~~

- Pick\<Type>

  摘取Type中的属性构造一个新的类型，比如：

  ~~~ts
  interface Todo {
    title: string;
    description: string;
    completed: boolean;
  }
   
  type A = Pick<Todo, "title" | "completed">;
  ~~~

  此时，`A = { title:string, completed:string }`。

  实现：

  ~~~ ts
  type Pick<T, K extends keyof T> = {
    [k in K]:T[k]
  }
  ~~~

- Omit\<Type>

  和Pick相反，删除选中属性构造类型，比如：

  ~~~ts
  interface Todo {
    title: string;
    description: string;
    completed: boolean;
  }
   
  type A = Omit<Todo, "title" | "completed">;
  ~~~

  此时，`A = { description:string }`。

  实现：

  ~~~ts
  type Omit<T, K extends keyof T> = {
    [k in keyof T as k extends K ? never : k]: T[k]
  }
  ~~~

- Exclude\<Type>

  从联合类型中排除给出类型，比如：

  ~~~ts
  type A = Exclude<"a" | "b" | "c", "a">;
  ~~~

  此时，`A = "b" | "c"`。

  实现：

  ~~~ts
  type Exclude<T, U> = T extends U ? never : T;
  ~~~

- Extract\<Type>

  从联合类型中提取给出类型，比如：

  ~~~ts
  type A = Extract<"a" | "b" | "c", "a" | "f">;
  ~~~

  此时，`A = "a"`。

  实现：

  ~~~ts
  type Extract<T, U> = T extends U ? T : never;
  ~~~

- NonNullable\<Type>

  通过从 `Type` 中排除 `null` 和 `undefined` 来构造类型，比如：

  ~~~ts
  type A = NonNullable<string | number | undefined>;
  ~~~

  此时，`A = string | number`。

  实现：

  ~~~ts
  type NonNullable<T> = T extends undefined | null ? never : T;
  ~~~

- Parameters\<Type>

  获取函数类型的参数类型，比如：

  ~~~ts
  type A = Parameters<(s: string) => void>;
  ~~~

  此时，`A = [s: string]`。

  实现：

  ~~~ts
  type Parameters<T> = T extends (parms: infer P) => any ? P : never 
  ~~~

- ConstructorParameters\<Type>

  获取构造函数类型的参数类型，比如：

  ~~~ts
  class C {
    constructor(a: number, b: string) {}
  }
  type A = ConstructorParameters<typeof C>;
  ~~~

  此时，`A = [a: number, b: string]`。

  实现：

  ~~~ts
  type ConstructorParameters<T extends abstract new (...args: any) => any> = 
    T extends abstract new (...args: infer P) => any ? P : never;
  ~~~

- ReturnType\<Type>

  构造一个由函数 `Type` 的返回类型组成的类型，比如：

  ~~~ts
  type A = ReturnType<() => string>;
  ~~~

  此时，`A = string`。

  实现：

  ~~~ts
  type ReturnType<T> = T extends (params: any) => infer R ? R : never;
  ~~~

- InstanceType\<Type>

  构造一个由 `Type` 中构造函数的实例类型组成的类型，比如：

  ~~~ts
  class C {
    x = 0;
    y = 0;
  }
   
  type A = InstanceType<typeof C>;
  ~~~

  此时，`A = C`。

  实现：

  ~~~ts
  type InstanceType<T extends new (...args: any) => any> = 
    T extends new (...args: any) => infer R ? R : any;
  ~~~

- NoInfer\<Type>

  阻止对所包含类型的推断。除了阻止推理之外， `NoInfer<Type>` 与 `Type` 相同，比如：

  ~~~ts
  function createStreetLight<C extends string>(
    colors: C[],
    defaultColor?: NoInfer<C>,
  ) {
    // ...
  }
  createStreetLight(["red", "yellow", "green"], "red");  // OK
  createStreetLight(["red", "yellow", "green"], "blue");  // Error
  ~~~

  实现：

  ~~~ts
  type NoInfer<T> = T & { [K in keyof T]?: T[K] };
  ~~~

- ThisParameterType\<Type>

  提取函数类型的 this 参数的类型，如果函数类型没有 `this` 参数，则提取未知，比如：

  ~~~ts
  function toHex(this: Number) {
    return this.toString(16);
  }
   
  function numberToString(n: ThisParameterType<typeof toHex>) {
    return toHex.apply(n);
  }
  ~~~

  实现：

  ~~~ts
  type ThisParameterType<T> = T extends (this: infer U, ...args: any[]) => any ? U : unknown;
  ~~~

- OmitThisParameter\<Type>

  从 `Type` 中删除 `this` 参数。如果 `Type` 没有显式声明的 `this` 参数，则结果只是 `Type` 。否则，将从 `Type` 创建一个没有 `this` 参数的新函数类型。泛型被删除，只有最后一个重载签名被传播到新的函数类型中，比如：

  ~~~ts
  function toHex(this: Number) {
    return this.toString(16);
  }
   
  const fiveToHex: OmitThisParameter<typeof toHex> = toHex.bind(5);
   
  console.log(fiveToHex());
  ~~~

  实现：

  ~~~ts
  type OmitThisParameter<T> = 
    T extends (this: any, ...args: infer A) => infer R ? (...args: A) => R : T;
  
  ~~~

- ThisType\<Type>

  此实用程序不返回转换后的类型。相反，它充当上下文 `this` 类型的标记，比如：

  ~~~ts
  type ObjectDescriptor<D, M> = {
    data?: D;
    methods?: M & ThisType<D & M>; // Type of 'this' in methods is D & M
  };
  ~~~

- Uppercase\<StringType>

  将字符串值类型转换成大写，比如：

  ~~~ts
  type A = Uppercase<'aa'>
  ~~~

  此时，`A = 'AA'`。

- Lowercase\<StringType>

  将字符串值类型转换成小写，比如：

  ~~~ts
  type A = Uppercase<'AA'>
  ~~~

  此时，`A = 'aa'`。

- Capitalize\<StringType>

  将字符串值类型首字母转换成大写，比如：

  ~~~ts
  type A = Uppercase<'aa'>
  ~~~

  此时，`A = 'Aa'`。

- Uncapitalize\<StringType>

  将字符串值类型首字母转换成小写，比如：

  ~~~ts
  type A = Uppercase<'Aa'>
  ~~~

  此时，`A = 'aa'`。

### 参考文献

[typescript文档——Keyof Type Operator ](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

[typescript文档——Typeof Type Operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

[typescript文档——Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

[typescript文档——Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

[typescript文档——Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

[typescript文档——Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

[typescript文档——Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)