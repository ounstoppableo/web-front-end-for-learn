### 导读

本篇文章是属于[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)合集的一个章节，[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)帮助读者剖析react源码，从fiber节点、lane调度优先级控制、微任务调度、虚拟dom更新机制、常见hooks源码解析等，帮助读者理解react设计架构与优化机制，让react的进阶不再困难，让前端能力的提升没有瓶颈。

### React中的fiber节点

#### 概念介绍

我们都知道react是通过加了一层中间层（虚拟dom），才能检测发生变化的节点所处的位置，从而***精确***(其实也不算精确，是以组件为单元的更新)的进行更新，vue借助了react的中间层想法，也使用了虚拟dom技术，在vue中虚拟dom被称为vnode，而在react中虚拟dom被称为fiber节点。

不过fiber节点并不是一开始就有的，fiber节点是react16时才提出的一个概念。为什么要引用fiber呢？因为在react16以前，虚拟dom的更新是同步过程，不仅会阻塞主线程，而且一旦开始更新还不能中断，否则会出现各种错误。为了解决这些问题，fiber应运而生，以react16以fiber为基础，构建了一个异步渲染流，大大提升了react的渲染效率。

下表是react15的虚拟dom更新与react16以后的虚拟dom更新特性对比：

| 特性     | React Stack (15 及以前) | React Fiber (16+)   |
| -------- | ----------------------- | ------------------- |
| 调和过程 | 同步、不可打断          | 可中断、增量处理    |
| 调用方式 | 函数递归                | 手动管理指针结构    |
| 更新控制 | 简单同步更新            | 优先级更新（Lanes） |
| 结构形式 | 虚拟 DOM 对象           | Fiber 节点链表      |
| 性能优化 | 基本无                  | 支持时间切片、并发  |

由于react15以前的虚拟dom已经是过去，没有学习的必要，所以**React源码阅读**都是基于fiber来解读react的虚拟dom更新原理的，在**React源码阅读**中，也会逐渐覆盖React Fiber所拥有的特性，并解析其是如何实现的，帮助读者深刻理解react的运行原理。

#### 结构介绍

~~~ts
// Fiber作为一个组件工作（创建、更新）结束后的存在形式，一个组件可以有多个fiber
export type Fiber = {

  // tag用于确定Fiber的类型
  tag: WorkTag,

  // fiber唯一标识
  key: null | string,
  
  // 这一属性用于在对本子元素进行整合的过程中保持其唯一性
  elementType: any,

  // 标识Fiber的类型，可以标识是组件function/class，也可以标识是div还是span
  type: any,

  // The local state associated with this fiber.
  stateNode: any,

  /*
  	概念性别名
	parent ： instance -> return 由于我们已将Fiber和instance合并，所以父对象恰好与return的Fiber相同。
	
	其余字段属于Fiber
	
	在完成对当前这个的处理后要返回的Fiber。
	这实际上就是父节点，但可能存在多个父节点（两个），
	所以这只是我们当前正在处理的对象的父节点。
	从概念上讲，它与栈帧的栈顶地址相同。
  */
  return: Fiber | null,

  // 单链表树结构
  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  // 用于连接真实dom.
  ref:
    | null
    | (((handle: mixed) => void) & {_stringRef: ?string, ...})
    | RefObject,

  refCleanup: null | (() => void),

  // Fiber的props
  pendingProps: any,
  memoizedProps: any,

  // 更新和回调的队列，比如fiber更新后的界面更新，和useEffects里的回调
  updateQueue: mixed,

  // useState里state的上一个状态
  memoizedState: any,

  // 上下文（useContext）、事件
  dependencies: Dependencies | null,

  /*
   描述Fiber及其子树属性的位域。例如：
	“并发模式”标志用于指示子树是否应默认采用异步模式。当创建一个Fiber时，它会继承其所属父Fiber的模式。
	在创建时可以设置额外的标志，但此后该值在整个的生命周期内应保持不变，尤其是在其子Fiber被创建时。
  */
  mode: TypeOfMode,

  // 副作用
  flags: Flags,
  subtreeFlags: Flags,
  deletions: Array<Fiber> | null,

  lanes: Lanes,
  childLanes: Lanes,

  // 指向工作中的自己（Fiber）的副本
  alternate: Fiber | null,

  /*
    用于为当前更新渲染此Fiber及其后代所花费的时间。
    这向我们展示了树在使用 sCU 进行记忆化方面表现如何。
    每次渲染时该值都会重置为 0，并且只有在我们不提前终止时才会更新。
    只有在启用“enableProfilerTimer”标志时才会设置此字段。
  */
  actualDuration?: number,
  actualStartTime?: number,

  /*
    此Fiber的最近一次渲染时间的持续时长。
    出于缓存优化的目的，当我们终止操作时，此值不会进行更新。
    只有在启用“enableProfilerTimer”标志时，此字段才会被设置。
  */
  selfBaseDuration?: number,

  /*
    此Fiber所有后代的基值乘积之和。
    此值在“完成”阶段会上升显示。
    只有在启用“ProfilerTimer”标志时，此字段才会被设置。
  */
  treeBaseDuration?: number,
};
~~~

下面是关于Fiber的类型：

~~~ts
export type WorkTag =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31;

// 函数组件
export const FunctionComponent = 0;

// 类组件
export const ClassComponent = 1;

// 树的根节点。可能嵌套在另一个节点内部。
export const HostRoot = 3;

// 一个子树。可能是一个通往不同渲染器的入口点。
export const HostPortal = 4;

// 表示真实dom的Fiber
export const HostComponent = 5;

// 表示文本节点的Fiber
export const HostText = 6;

// <></>
export const Fragment = 7;

// React.StrictMode / ConcurrentMode / NoMode
export const Mode = 8;

// useContext() 对应的消费节点
export const ContextConsumer = 9;

// <Context.Provider>
export const ContextProvider = 10;

// 使用 React.forwardRef() 创建的组件
export const ForwardRef = 11;

// <Profiler> 性能监测节点
export const Profiler = 12;

// <Suspense> 组件
export const SuspenseComponent = 13;

// React.memo() 包裹的组件
export const MemoComponent = 14;

// 优化后的 memo，避免多次判断
export const SimpleMemoComponent = 15;

// React.lazy() 懒加载组件
export const LazyComponent = 16;

// 首次渲染时还不确定是函数还是类组件
export const IncompleteClassComponent = 17;

export const DehydratedFragment = 18;

export const SuspenseListComponent = 19;

export const ScopeComponent = 21;

// 对应隐藏内容（如 Suspense fallback 后挂起的部分）
export const OffscreenComponent = 22;

// 早期版本用于隐藏内容的组件（已过时）
export const LegacyHiddenComponent = 23;

// React 18 Cache API，用于缓存资源
export const CacheComponent = 24;

// 调试性能追踪标记（用于 React Profiler）
export const TracingMarkerComponent = 25;

export const HostHoistable = 26;

export const HostSingleton = 27;

export const IncompleteFunctionComponent = 28;

export const Throw = 29;

export const ViewTransitionComponent = 30;

export const ActivityComponent = 31;
~~~

到这里，我们应该对Fiber的结构应该能有一个大概的认识了。

在react中，根节点基于Fiber节点有了更完善的封装，其被定义为FiberRoot，现在我们来看看FiberRoot的结构：

~~~ts
export type FiberRoot = {
  ...BaseFiberRootProperties,
  ...SuspenseCallbackOnlyFiberRootProperties,
  ...UpdaterTrackingOnlyFiberRootProperties,
  ...TransitionTracingOnlyFiberRootProperties,
  ...ProfilerCommitHooksOnlyFiberRootProperties,
};

// 这里我们只介绍BaseFiberRootProperties
type BaseFiberRootProperties = {
  // 用于标识根节点的类型 (legacy, batched, concurrent等等)
  tag: RootTag,

  // 真实dom
  containerInfo: Container,
  // 只用于持久化更新
  pendingChildren: any,
  // 根Fiber节点
  current: Fiber,

  pingCache: WeakMap<Wakeable, Set<mixed>> | Map<Wakeable, Set<mixed>> | null,

  // 由 setTimeout 函数返回的超时处理句柄。用于取消一个即将到期的超时任务，如果该任务被新的任务所取代的话。
  timeoutHandle: TimeoutHandle | NoTimeout,
  // When a root has a pending commit scheduled, calling this function will
  // cancel it.
  // TODO: Can this be consolidated with timeoutHandle?
  cancelPendingCommit: null | (() => void),
  // 顶级上下文对象，用于“renderSubtreeIntoContainer”方法中
  context: Object | null,
  pendingContext: Object | null,

  // 用于创建一个链表，该链表将包含所有有未完成任务安排的根节点。
  next: FiberRoot | null,

  //调度器通过 `Scheduler.scheduleCallback` 返回的节点。表示根节点将要处理的下一个渲染任务。
  callbackNode: any,
  callbackPriority: Lane,
  expirationTimes: LaneMap<number>,
  hiddenUpdates: LaneMap<Array<ConcurrentUpdate> | null>,

  pendingLanes: Lanes,
  suspendedLanes: Lanes,
  pingedLanes: Lanes,
  warmLanes: Lanes,
  expiredLanes: Lanes,
  indicatorLanes: Lanes, // enableDefaultTransitionIndicator only
  errorRecoveryDisabledLanes: Lanes,
  shellSuspendCounter: number,

  entangledLanes: Lanes,
  entanglements: LaneMap<Lanes>,

  pooledCache: Cache | null,
  pooledCacheLanes: Lanes,

  // TODO: In Fizz, id generation is specific to each server config. Maybe we
  // should do this in Fiber, too? Deferring this decision for now because
  // there's no other place to store the prefix except for an internal field on
  // the public createRoot object, which the fiber tree does not currently have
  // a reference to.
  identifierPrefix: string,

  onUncaughtError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onCaughtError: (
    error: mixed,
    errorInfo: {
      +componentStack?: ?string,
      +errorBoundary?: ?React$Component<any, any>,
    },
  ) => void,
  onRecoverableError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,

  // enableDefaultTransitionIndicator only
  onDefaultTransitionIndicator: () => void | (() => void),
  pendingIndicator: null | (() => void),

  formState: ReactFormState<any, any> | null,

  // enableViewTransition only
  transitionTypes: null | TransitionTypes, // TODO: Make this a LaneMap.
  // enableGestureTransition only
  pendingGestures: null | ScheduledGesture,
  stoppingGestures: null | ScheduledGesture,
  gestureClone: null | Instance,
};
~~~

> **注意**
>
> `Scheduler.scheduleCallback`实际上就是[react调度工作流](https://www.unstoppable840.cn/article/7794b91d-606a-4ec0-847e-b871098ecc97)中介绍的`unstable_scheduleCallback`

##### memoizedState

`memoizedState`是一个重要的参数，用于hooks的更新。其实简单来说`memoizedState`就是存储`state`，只是其存储的方式需要提一下：

~~~ts
function MyComponent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('React');
  const [age, setAge] = useState(18);
  return <div>{count} - {name} - {age}</div>;
}
~~~

比如如上我们定义了一个函数，那么`memorizedState`的存储结构如下：
~~~
       Fiber (MyComponent)
       ┌────────────────────────────┐
       │ memoizedState ──────────┐  │
       └─────────────────────────│──┘
                                 ↓
                     ┌─────────────────────┐
                     │ Hook 1              │
                     │ useState(0)         │
                     │ memoizedState = 0   │
                     │ queue = { pending } │
                     │ next ─────────────┐ │
                     └─────────────────────┘
                                         ↓
                     ┌─────────────────────┐
                     │ Hook 2              │
                     │ useState("React")   │
                     │ memoizedState = "React"
                     │ queue = { pending } │
                     │ next ─────────────┐ │
                     └─────────────────────┘
                                         ↓
                     ┌─────────────────────┐
                     │ Hook 3              │
                     │ useState(18)        │
                     │ memoizedState = 18  │
                     │ queue = { pending } │
                     │ next = null         │
                     └─────────────────────┘
~~~

它是以链表的形式存储的，并且链表头是我们最开始定义的`useState`所产生的`hooks`。详细代码介绍可以阅读[react常见hooks的实现原理](https://www.unstoppable840.cn/article/b567273d-a71b-442e-bc19-d164da7b5a2e)。
