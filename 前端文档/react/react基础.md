## react基础语法

### JSX

> jsx即在js代码中嵌套的html代码，例如：

~~~react
function MyButton() {
  return (
    <button>I'm a button</button>
  );
}
~~~

#### 注意点

- jsx很严格，标签必须有闭合，比如原来的\<br>，在jsx中就需要写成\<br />

- 组件返回的jsx必须只有一个，内部可以进行嵌套，但是不能并列多个标签一起返回，比如：

  ~~~react
  function AboutPage() {
    return (
      <>
        <h1>About</h1>
        <p>Hello there.<br />How do you do?</p>
      </>
    );
  }
  //不能写成
  function AboutPage() {
    return (
        <h1>About</h1>
        <p>Hello there.<br />How do you do?</p>
    );
  }
  // <>...</> 类似 <div>...</div>
  ~~~

#### 添加样式

> 在react中，可以使用 `className` 来指定一个 CSS 的 class

~~~html
<img className="avatar" />
~~~

#### 模板

JSX 会让你把标签放到 JavaScript 中。而大括号会让你 “回到” JavaScript 中，这样你就可以从你的代码中嵌入一些变量并展示给用户。例如，这将显示 `user.name`：

~~~react
return (
  <h1>
    {user.name}
  </h1>
);
~~~

你还可以将 JSX 属性 “转义到 JavaScript”，但你必须使用大括号 **而非** 引号。例如，`className="avatar"` 是将 `"avatar"` 字符串传递给 `className`，作为 CSS 的 class。但 `src={user.imageUrl}` 会读取 JavaScript 的 `user.imageUrl` 变量，然后将该值作为 `src` 属性传递：

~~~react
return (
  <img
    className="avatar"
    src={user.imageUrl}
  />
);
~~~

~~~react
//更复杂的写法
const user = {
  name: 'Hedy Lamarr',
  imageUrl: 'https://i.imgur.com/yXOvdOSs.jpg',
  imageSize: 90,
};

export default function Profile() {
  return (
    <>
      <h1>{user.name}</h1>
      <img
        className="avatar"
        src={user.imageUrl}
        alt={'Photo of ' + user.name}
          //存储的是对象
        style={{
          width: user.imageSize,
          height: user.imageSize
        }}
      />
    </>
  );
}

~~~

#### 条件渲染

react没有v-if或*ngIf这样的指令进行条件渲染，需要手动进行if判断

~~~react
let content;
if (isLoggedIn) {
  content = <AdminPanel />;
} else {
  content = <LoginForm />;
}
return (
  <div>
    {content}
  </div>
);

//也可以这样写
<div>
  {isLoggedIn ? (
    <AdminPanel />
  ) : (
    <LoginForm />
  )}
</div>
~~~

#### 列表渲染

与条件渲染同样，你需要手动进行渲染

~~~react
const products = [
  { title: 'Cabbage', id: 1 },
  { title: 'Garlic', id: 2 },
  { title: 'Apple', id: 3 },
];
const listItems = products.map(product =>
  <li key={product.id}>
    {product.title}
  </li>
);

return (
  <ul>{listItems}</ul>
);
~~~

**注意**， `<li>` 有一个 `key` 属性。对于列表中的每一个元素，你都应该传递一个字符串或者数字给 `key`，用于在其兄弟节点中唯一标识该元素。通常 key 来自你的数据，比如数据库中的 ID。如果你在后续插入、删除或重新排序这些项目，React 将依靠你提供的 key 来思考发生了什么

#### 响应事件

~~~react
function MyButton() {
  function handleClick() {
    alert('You clicked me!');
  }

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
~~~

**注意**，`onClick={handleClick}` 的结尾没有小括号！不要 **调用** 事件处理函数：你只需 **把函数传递给事件** 即可。当用户点击按钮时 React 会调用你传递的事件处理函数

#### 响应式

利用[`useState`](https://react.docschina.org/reference/react/useState)

~~~react
import { useState } from 'react';
~~~

~~~react
function MyButton() {
  const [count, setCount] = useState(0);
}
//你将从 useState 中获得两样东西：当前的 state（count），以及用于更新它的函数（setCount）。你可以给它们起任何名字，但按照惯例会像 [something, setSomething] 这样为它们命名
~~~

第一次显示按钮时，`count` 的值为 `0`，因为你把 `0` 传给了 `useState()`。当你想改变 state 时，调用 `setCount()` 并将新的值传递给它。点击该按钮计数器将递增:

~~~react
function MyButton() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}
~~~

### HOOK

以 `use` 开头的函数被称为 **Hook**。`useState` 是 React 提供的一个内置 Hook。你可以在 [React API 参考](https://react.docschina.org/reference/react) 中找到其他内置的 Hook。你也可以通过组合现有的 Hook 来编写属于你自己的 Hook

Hook 比普通函数更为严格。你只能在你的组件（或其他 Hook）的 **顶层** 调用 Hook。如果你想在一个条件或循环中使用 `useState`，请提取一个新的组件并在组件内部使用它

### 组件通信

~~~react
import { useState } from 'react';

export default function MyApp() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <div>
      <h1>Counters that update together</h1>
      <MyButton count={count} onClick={handleClick} />
      <MyButton count={count} onClick={handleClick} />
    </div>
  );
}

function MyButton({ count, onClick }) {
  return (
    <button onClick={onClick}>
      Clicked {count} times
    </button>
  );
}

//组件标签内插入标签会被children接收
import Avatar from './Avatar.js';

function Card({ children }) {
  return (
    <div className="card">
      {children}
    </div>
  );
}

export default function Profile() {
  return (
    <Card>
      <Avatar
        size={100}
        person={{ 
          name: 'Katsuko Saruhashi',
          imageId: 'YfeOqp2'
        }}
      />
    </Card>
  );
}
~~~

## react哲学

### react最核心的就是useState，它实现了react的响应式，我们来看看其原理

> 当执行了某个函数，改变了组件中的变量，组件是不会进行重新渲染的，所以jsx也没有办法渲染成虚拟dom，也就无法反馈到页面上
>
> 那我们该如何进行组件的刷新呢？
>
> 通过使用useState解构出来的set方法，执行set的同时会将组件重新渲染
>
> 那我们执行set之后，原本定义的普通变量是不是也能正确的发生改变呢？换句话说，我们能不能先改变某个普通变量，然后执行set函数，这样改变的普通变量是否也能反馈到页面中呢？答案是不能。
>
> 因为组件的重新渲染是组件函数的重新执行，内部定义的变量也会重新被创建，即开辟了新空间，在新空间里重新赋值，所以原来的变量并不会被保留，而是被垃圾回收了，如何进行保存呢？
>
> 我们可以通过useState结构出来的第一个变量，这其实就可以解释为什么我们能够用const去存储，然后还能用set函数去进行改变，因为它们指向的并不是一个空间，set函数只是基于现在的值去外部进行改变，然后在组件重新渲染时再开辟一个空间渲染current值，所以才实现了存储的效果

### 但是由于这种重新渲染的性质，我们也可以给普通变量玩出花样

> 我们在赋值变量时可以基于useState的变量，这样也可以实现记忆化取值，只是我们要记住：改变普通变量是不会让组件重新渲染的
>
> 所以这样定义的变量和vue的getter类型，但又有很大的不同

### vue和react响应式的区别

> vue的响应式进行重新渲染的只是虚拟dom，并不会对组件函数进行重新执行
>
> 而react是重新渲染组件函数，根据jsx的改变再去渲染虚拟dom

### useState的异步性

> 我们知道，html的渲染是异步的，他会在js代码执行完后才进行渲染
>
> 由此我们可以推导出，useState对页面的重新渲染也会是异步的，所以在set函数之后写的逻辑如果不是持久化的是不会被存储的
>
> 我们假设使用持久化存储，比如再写一个set函数，那会发生什么呢？

~~~react
import { useState } from 'react';

export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      //这样写之后会发生什么呢？
      <button onClick={() => {
        setNumber(number + 1);
        setNumber(number + 1);
        setNumber(number + 1);
      }}>+3</button>
      //显示在页面上只会+1
      //为什么呢？
      //我们刚刚有说到异步性，所以在重新渲染组件之前，我们会把后面两个set函数都执行了，此时的number仍然是当前组件存储的number
      //相当于执行了三次setNumber(0 + 1)
      //由于react的优化，实际的渲染并不会执行三次
    </>
  )
}
~~~

> 那我们有时候可能就希望多次的set能有效，应该怎么做呢？先说结论：

~~~react
import { useState } from 'react';

export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      <button onClick={() => {
        setNumber(n => n + 1);
        setNumber(n => n + 1);
        setNumber(n => n + 1);
      }}>+3</button>
    </>
  )
}
~~~

> 这是为什么呢？
>
> 首先我们需要明白set函数的执行原理：
>
> 假设我们执行了setNumber(number + 1)，它会把number+1放入执行队列，表示将number+1赋值给存储在state的值
>
> 执行多个setNumber(number + 1)，就是将多个这个逻辑放进队列中，之后再取出一一执行
>
> 而setNumber(n => n + 1)，就表示将n => n + 1放入执行队列，n会被传入存储在state的值，这样一来执行多个setNumber(n => n + 1)，由于n会同步更新，所以可以实现累加的效果
>
> 我们要注意，set函数将逻辑放入的是**执行队列**，也就是说先进先出，起最终效果的一定是最后一个

### 将state视为只读

> 我们知道，一般state都是由const进行修饰的，官方建议我们这么做，因为将state视为只读可以减少很多不必要的麻烦
>
> 因为我们对state进行修改是毫无意义的，我们之前有说过useState的原理：
>
> - 首先，想让页面进行更新，我们必须调用set函数，对普通变量进行修改是不会触发组件再渲染的
> - 其次，我们解构出的state并不是真正的state，而只是一个映射，真正的state存储在组件之外，并不会随着组件的更新而变化，但是解构出来的state是会根据组件的更新而重新在真实的state进行取值然后赋值的，所以对它进行修改，下次组件更新就失效了
>
> 所以官方给我们的建议是，将state视为只读

> 但是现实往往不尽人意，开发者总是会在不经意间改变了state
>
> 对于普通数据类型，加上了const，那它肯定就无法改变了，这里我们就不过多赘述了
>
> 但是对于数组、对象，这些即使用const修饰，属性还是能够发生改变，这时我们就要注意不要对其产生修改了
>
> 官方对这种情况有一个专有的名词：mutation，即不小心对state进行了修改

~~~react
import { useState } from 'react';
export default function MovingDot() {
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });
  return (
    <div
        //没有执行set函数，页面并不会刷新
      onPointerMove={e => {
        position.x = e.clientX;
        position.y = e.clientY;
      }}
        //应该改成这样
        // setPosition({
        // x: e.clientX,
        // y: e.clientY
        // });
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}>
      <div style={{
        position: 'absolute',
        backgroundColor: 'red',
        borderRadius: '50%',
        transform: `translate(${position.x}px, ${position.y}px)`,
        left: -10,
        top: -10,
        width: 20,
        height: 20,
      }} />
    </div>
  );
}
~~~

> 但是这样又会有一个问题，如果是一个表单，里面有很多字段，我们这样一一赋值是不是太过繁琐，这时我们可以使用展开语法（...）
>
> 由于展开语法只是浅拷贝，对于更深层次我们也需要进行更深层次的展开，总之就是为了不改变state，想简化可以考虑使用immer

~~~sh
#尝试使用 Immer:

npm install use-immer
import { useImmer } from 'use-immer' 替换掉 import { useState } from 'react'
~~~

> 对于数组我们可以使用map、filter等不会改变原数组的方法，但是也要注意数组对象中对对象的修改

> 其实看到这里，读者心中可能会有些疑问，我们何不在原有state上进行修改，修改后直接放到set里不就好了吗，为什么要在弄一个state的拷贝，再放入set
>
> 这种方法有一个非常大的问题，我们先举个例子：

~~~react
import { useState } from 'react';

export default function Form() {
  const [person, setPerson] = useState({
    firstName: 'Barbara',
    lastName: 'Hepworth',
    email: 'bhepworth@sculpture.com'
  });

    //我们这样写逻辑
    //改变了原来的state，并把state放到set函数中
  function handleFirstNameChange(e) {
    person.firstName = e.target.value;
    setPerson(person)
  }
    //运行结果就是输入框不会发生变化
    //为什么会有这种情况呢？
    //往下看

  return (
    <>
      <label>
        First name:
        <input
          value={person.firstName}
          onChange={handleFirstNameChange}
        />
      </label>
    </>
  );
}
~~~

> 我们发现setPerson(person)并不会引起页面的更新，可以在组件内放一个console.log，会发现console.log一直没执行，也就是说组件没进入重新渲染的逻辑，这时什么情况呢？
>
> 如果使用setPerson({...person})则能正常执行
>
> 我直接把官方的话截图下来解释吧：
>
> ![](C:\Users\a1520\Desktop\react学习\images\QQ截图20231026112013.png)
>
> 所以我们必须使用副本。当然，有人可能会说，那我们只需要改变外层，内层仍然使用原先的不也可以吗，没必要进行深拷贝，比如这样

~~~react
import { useState } from 'react';

export default function Form() {
  console.log(1111)
  const [person, setPerson] = useState({
    firstName: {
      a:{b:1}
    },
  });

    //person嵌套了多层，虽然解构了一层，但是子属性任然引用的是原state下的属性
    //这样写能进行正常的修改和显示
  function handleFirstNameChange(e) {
    person.firstName.a.b = e.target.value;
    setPerson({...person})
  }

  function handleLastNameChange(e) {
    person.lastName = e.target.value;
  }

  function handleEmailChange(e) {
    person.email = e.target.value;
  }

  return (
    <>
      <label>
        First name:
        <input
          value={person.firstName.a.b}
          onChange={handleFirstNameChange}
        />
      </label>
    </>
  );
}
~~~

> 虽然可以这样写，但是为了代码的可维护性，还是按照官方规范来吧！
>
> ![](C:\Users\a1520\Desktop\react学习\images\QQ截图20231026112804.png)

## react拓展

### 状态管理

react的状态是react响应式的核心，如果用的不好，可能会对代码的性能、维护性有很大的负面影响，这时状态管理就显得尤为重要

下面将介绍react状态管理的几个切入方向：

- 除去多余的状态
- 组件间共享状态
- 保留和重置状态
- 利用reducer进行统一的状态管理
- 深层的数据传递（content）

#### 除去多余的状态

对于一个react组件，内部如果写太多状态对效率是大打折扣的，当存在这种情况的时候，我们需要考虑有没有办法去简化状态的声明，我们可以从以下方向去进行代码审核：

- 合并联合的state
- 避免互相矛盾的state
- 避免冗余的state
- 避免重复的state
- 避免深度嵌套的state

##### 合并联合的state

~~~react
//x,y不必分开设置
const [x, setX] = useState(0);
const [y, setY] = useState(0);

//可以合并联合
const [position, setPosition] = useState({ x: 0, y: 0 });
~~~

##### 避免互相矛盾的state

~~~react
//我们或许可以把这种杂糅的状态进行合并  
const [isSending, setIsSending] = useState(false);
const [isSent, setIsSent] = useState(false);

//变成这样
const [status, setStatus] = useState('typing'); //'typing' (初始), 'sending', 和 'sent'
~~~

##### 避免冗余的state

~~~react
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');

//我们完全可以舍去fullName
//通过组件的渲染去给fullName进行初始化
const fullName = firstName + ' ' + lastName
~~~

##### 避免重复的state

~~~react
//这样定义在修改时通常会忘了提交setSelectedItem，导致selectedItem并不会随着items的变化而变化
const [items, setItems] = useState(initialItems);
const [selectedItem, setSelectedItem] = useState(
    items[0]
);

//这种情况应该写成这样
const [items, setItems] = useState(initialItems);
const [selectedId, setSelectedId] = useState(0);
const selectedItem = items.find(item =>
    item.id === selectedId
);
~~~

##### 避免深度嵌套的state

将深度嵌套的state进行扁平化处理

#### 组件间共享状态

> - 通常我们会将需共享的状态提升至公共父组件
>
> - 或者使用useContext

#### 保留和重置状态

> 保留和重置状态常常会在表单里被用到

要探索这个问题，我们需要深入到react的渲染原理

> react每次渲染，都会基于原来的虚拟dom树，如果能够进行复用就进行复用，这样也是为了提高react的效率，但这也导致一个问题，复用后state的数据并没有清除，比如：

~~~react
import { useState } from 'react';

export default function App() {
  const [isFancy, setIsFancy] = useState(false);
  return (
    <div>
      {isFancy ? (
        <Counter isFancy={true} /> 
      ) : (
        <Counter isFancy={false} /> 
      )}
      <label>
        <input
          type="checkbox"
          checked={isFancy}
          onChange={e => {
            setIsFancy(e.target.checked)
          }}
        />
        使用好看的样式
      </label>
    </div>
  );
}

function Counter({ isFancy }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(false);

  let className = 'counter';
  if (hover) {
    className += ' hover';
  }
  if (isFancy) {
    className += ' fancy';
  }

  return (
    <div
      className={className}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <h1>{score}</h1>
      <button onClick={() => setScore(score + 1)}>
        加一
      </button>
    </div>
  );
}
~~~

> 在上述实例中，我们点击**使用好看的样式**按钮进行组件的重新渲染，保留在state的score并不会重置
>
> 这就是react复用的副作用，组件并不会被销毁然后重新构造，而是基于原来进行升级
>
> 那什么情况组件不会被销毁，什么情况下组件会被销毁呢？主要是基于**组件处于的ui树中的位置是否有变化**
>
> ![](C:\Users\a1520\Desktop\react学习\images\QQ截图20231026170655.png)
>
> 像上面情况，counter组件在ui树的位置并没有发生变化，所以被复用了
>
> 我们想重置应该怎么做？

~~~react
import { useState } from 'react'; 

export default function App() {
  const [isPaused, setIsPaused] = useState(false);
  return (
    <div>
      {isPaused ? (
        <p>待会见！</p> 
      ) : (
        <Counter /> 
      )}
      <label>
        <input
          type="checkbox"
          checked={isPaused}
          onChange={e => {
            setIsPaused(e.target.checked)
          }}
        />
        休息一下
      </label>
    </div>
  );
}

function Counter() {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(false);

  let className = 'counter';
  if (hover) {
    className += ' hover';
  }

  return (
    <div
      className={className}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <h1>{score}</h1>
      <button onClick={() => setScore(score + 1)}>
        加一
      </button>
    </div>
  );
}
~~~

> 上述情况就是counter的ui树位置发生了改变，所以计数会被重置
>
> 除了这种方法我们还可以如何重置呢？
>
> 其实弄清楚原理很简单，就是把其在ui树的位置改变就行了：
>
> - 添加key值，key值是react进行组件是否是同一个的判断依据，如果两个相同的组件key值不同的话，那他们就是不同组件
> - 在外部套一层不同的标签
>
> 一般还是建议使用key值

#### 利用reducer进行统一的状态管理

> reducer里dispatch的执行也会引发组件的更新，其实功能与useState类似，只是多了一步数据的处理逻辑

~~~react
import { useReducer } from 'react';
import AddTask from './AddTask.js';
import TaskList from './TaskList.js';

export default function TaskApp() {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);

  function handleAddTask(text) {
    dispatch({
      type: 'added',
      id: nextId++,
      text: text,
    });
  }

  function handleChangeTask(task) {
    dispatch({
      type: 'changed',
      task: task,
    });
  }

  function handleDeleteTask(taskId) {
    dispatch({
      type: 'deleted',
      id: taskId,
    });
  }

  return (
    <>
      <h1>布拉格的行程安排</h1>
      <AddTask onAddTask={handleAddTask} />
      <TaskList
        tasks={tasks}
        onChangeTask={handleChangeTask}
        onDeleteTask={handleDeleteTask}
      />
    </>
  );
}

function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': {
      return [
        ...tasks,
        {
          id: action.id,
          text: action.text,
          done: false,
        },
      ];
    }
    case 'changed': {
      return tasks.map((t) => {
        if (t.id === action.task.id) {
          return action.task;
        } else {
          return t;
        }
      });
    }
    case 'deleted': {
      return tasks.filter((t) => t.id !== action.id);
    }
    default: {
      throw Error('未知 action: ' + action.type);
    }
  }
}

let nextId = 3;
const initialTasks = [
  {id: 0, text: '参观卡夫卡博物馆', done: true},
  {id: 1, text: '看木偶戏', done: false},
  {id: 2, text: '打卡列侬墙', done: false}
];
~~~

#### 深层的数据传递（context）

> useContext可以进行多层穿透传递，可以减少props的多层传递

### 应急方案

> 有时候react的操作可能满足不了我们的需求，我们通常需要自己去操作dom（聚焦、视频播放），这时候该怎么做呢？
>
> react为我们提供了ref，可以用于获取dom元素

#### ref原本的作用

> - ref本来是用来进行持久化存储的，它相比state有一点区别，就是ref不会使组件重新渲染
>
> - 还有一个作用就是能获取到原生dom节点，具体写法：

~~~react
import { useRef } from 'react';

export default function Form() {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleClick}>
        聚焦输入框
      </button>
    </>
  );
}
~~~

##### 何时会使用到ref

> - 存储timeoutId
> - 存储和操作dom元素 （常用）
> - 存储不需要被用来计算jsx的其他数据

##### 获取dom的小坑

> 我们有时候可能会一不小心把ref用在了组件标签上，这样并不能获取到组件内部的标签，但是我们可以通过以下方法去获取：

~~~react
import { forwardRef, useRef } from 'react';

//利用forwardRef包装后，就可以获取组件内部的标签了
const MyInput = forwardRef((props, ref) => {
  return <input {...props} ref={ref} />;
});

export default function Form() { 
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current.focus();
  }

  return (
    <>
      <MyInput ref={inputRef} />
      <button onClick={handleClick}>
        聚焦输入框
      </button>
    </>
  );
}
~~~

#### ref被赋予dom的时机

> 我们可能好奇，明明我们一开始给ref赋值的是null，它是什么时候变成组件实例的呢？
>
> 这里我们需要先知晓react组件的渲染过程：计算jsx（生成虚拟DOM）->反映到真实dom上
>
> ref就是在第二个阶段被赋值的，明确这一点对后面学习**effect的作用**有很大的帮助

#### effect的介绍

> effect是react中专门用于进行额外操作的hook

##### effect的使用步骤

> - 声明effect
> - 指定依赖
> - 必要时添加清理函数

##### effect执行时机

> - 每次组件将虚拟dom反映到真实dom之后才会执行，倘若effect内部没有set函数或其他会引发组件再渲染的hook，那么effect是不会引发组件再渲染的
>
> - 一般来说effect再每次组件渲染完后都会执行
> - 但是增加依赖后会在依赖改变后才进行执行，依赖会放在第二个参数，以数组形式传参，没有依赖时可以省略第二个参数，也可以只写一个[]

##### effect依赖的原理

> - effect会存储上一次的依赖，然后和现在的依赖进行对比(Object.is)，不同的话才执行effect内的逻辑，否则不执行
>
> - 依赖如果为空，那么每次渲染都会执行

**什么时候需要些依赖？**

> - 依赖一般都是持久化的数据：state、props等
> - 如果effect回调内部有使用到这些数据，那么就需要在依赖中声明

##### 使用到依赖却不声明的后果

> 这是一个计时器，本意是可以修改每次自增的大小
>
> 然而由于缺失了依赖，它失去了修改每次自增大小的功能
>
> 我们来分析分析

~~~react
import { useState, useEffect } from 'react';

export default function Timer() {
  const [count, setCount] = useState(0);
  const [increment, setIncrement] = useState(1);

  function onTick() {
	setCount(count + increment);
  }
	
    //由于没写依赖，effect会认为你的回调内部并没有发生改变
    //以至于每次调用的onTick都是第一次声明的onTick，也就是每次都是执行setCount(0 + 1);
  useEffect(() => {
    const id = setInterval(onTick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1>
        计数器：{count}
        <button onClick={() => setCount(0)}>重制</button>
      </h1>
      <hr />
      <p>
        每秒递增：
        <button disabled={increment === 0} onClick={() => {
          setIncrement(i => i - 1);
        }}>–</button>
        <b>{increment}</b>
        <button onClick={() => {
          setIncrement(i => i + 1);
        }}>+</button>
      </p>
    </>
  );
}
~~~

> 我们要明确：
>
> - onTick在每次渲染后其实都是指向不同的空间的
> - 然而由于useEffect没写依赖，他会认为回调中没有东西发生变化，以至于其没有修改onTick的地址
> - 所以每次执行的都是刚开始的onTick

我们应该如何进行修复呢？

- 第一种方法：将onTick写到effect内部

  ~~~react
  import { useState, useEffect } from 'react';
  
  export default function Timer() {
    const [count, setCount] = useState(0);
    const [increment, setIncrement] = useState(1);
  
    useEffect(() => {
     	function onTick() {
  		setCount(count + increment);
    	}
      const id = setInterval(onTick, 1000);
      return () => clearInterval(id);
    }, [count,increment]);
  
    return (
      <>
        <h1>
          计数器：{count}
          <button onClick={() => setCount(0)}>重制</button>
        </h1>
        <hr />
        <p>
          每秒递增：
          <button disabled={increment === 0} onClick={() => {
            setIncrement(i => i - 1);
          }}>–</button>
          <b>{increment}</b>
          <button onClick={() => {
            setIncrement(i => i + 1);
          }}>+</button>
        </p>
      </>
    );
  }
  ~~~

  > 这样我们就可以明确依赖

- 第二种方法：useEffectEvent

  ~~~react
  import { useState, useEffect,useEffectEvent } from 'react';
  
  export default function Timer() {
    const [count, setCount] = useState(0);
    const [increment, setIncrement] = useState(1);
      //useEffectEvent可以实时监听数据变化，实时拿到最新数据
    const callback = useEffectEvent(()=>{
  		setCount(count + increment);
    	})
    useEffect(() => {
      const id = setInterval(callback, 1000);
      return () => clearInterval(id);
    }, []);
  
    return (
      <>
        <h1>
          计数器：{count}
          <button onClick={() => setCount(0)}>重制</button>
        </h1>
        <hr />
        <p>
          每秒递增：
          <button disabled={increment === 0} onClick={() => {
            setIncrement(i => i - 1);
          }}>–</button>
          <b>{increment}</b>
          <button onClick={() => {
            setIncrement(i => i + 1);
          }}>+</button>
        </p>
      </>
    );
  }
  ~~~

##### effect原理

> 到了这里我们其实可以猜到effect的回调是会不断更新的
>
> 而这个回调更新的契机就是依赖发生变化，如果没写依赖，那就不会进行更新
>
> 其实清理函数也与依赖变化有关
>
> 如果我们写了一个清理函数，内部可以写一个console.log，这样我们就可以清楚的知道，在没写依赖的时候控制台是不会有输出的，写了依赖时只有依赖发生变化时才会有输出

#### 将事件从effect中分开（useEffectEvent）

> 通常有一种情况，我们不希望非响应式的部分存在于effect中，比如：

~~~react
//我们并不希望theme变化时effect也进行变化
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      showNotification('Connected!', theme);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]);

  return <h1>Welcome to the {roomId} room!</h1>
}
~~~

> 我们可以通过useEffectEvent进行分离

~~~react
function ChatRoom({ roomId, theme }) {
    const callback = useEffectEvent(() => {
      showNotification('Connected!', theme);
    })
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', callback);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]);

  return <h1>Welcome to the {roomId} room!</h1>
}
~~~

> 现在我们知道useEffectEvent的使用场景了，下面我们来说一说其作用及原理

##### useEffectEvent的作用

> 我们以前在effect内部执行某个函数，这个函数内部用使用到响应式的数据时，我们通常需要添加依赖，否则effect的回调不会进行更新，执行的一直都是第一次创建的回调
>
> 然后我们会把这个函数的声明放到effect的回调中，再去添加依赖
>
> 现在我们有了一个新方法，不必在effect中声明函数，而是在外部使用useEffectEvent将函数包裹
>
> **它起到的作用**就是：当effect引用useEffectEvent返回的函数时，这个函数会一直保持最新的状态，而不需要去添加依赖，并且这个函数内部响应式的变化也不会引起effect重新执行

##### useEffectEvent的原理

> 顾名思义，我们可以把useEffectEvent返回的callback作为一个事件
>
> 每次依赖更新时去执行callback，实际上是触发了这个事件，然后事件会执行其回调，其回调由于每次组件重新渲染都会再赋值，所以一直是最新状态

##### useEffectEvent的局限性

> - 只能在effect中调用
> - 千万不要把它传给其他组件或hook

#### 自定义hook

##### 规则

- 自定义hook一定要use开头

##### 作用

- 组件间共享逻辑
- 复用，减少代码量
- **注意：**自定义hook共享的是状态逻辑，而不是状态本身：就像调用一个函数，这个函数被调用两次，服用的是逻辑，内部的变量是不同空间的

##### 工作流程

- 每次组件重新渲染时，hook都会被执行
- 其内部有自己的生命周期，与外部的生命周期隔离：自定义hook内部的hook比如useEffect和useState都是基于该hook的，并不是基于外部组件的生命周期
- 但是hook内部的set函数可以使外部组件的再渲染









