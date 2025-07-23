### 导读

本篇文章是属于[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)合集的一个章节，[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)帮助读者剖析react源码，从fiber节点、lane调度优先级控制、微任务调度、虚拟dom更新机制、常见hooks源码解析等，帮助读者理解react设计架构与优化机制，让react的进阶不再困难，让前端能力的提升没有瓶颈。

### React常见hooks的实现原理

我们在[React虚拟DOM更新解析中](https://www.unstoppable840.cn/article/00871eb1-d110-42c7-a67d-4e0f7c1d34e3)提到过，在`beginWork`阶段，通过区分`FunctionComponent`tag来调用了`updateFunctionComponent`，然后`updateFunctionComponent`又调用了`renderWithHooks`去实现hooks。具体入口如下：

~~~ts
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
    // 记住这个式子
    currentlyRenderingFiber = workInProgress;
    // ...
    ReactSharedInternals.H =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
    // ...
    // 这里Component执行的是我们平常写的返回JSX的函数组件
    let children = Component(props, secondArg);
    return children;
}

~~~

~~~ts
const HooksDispatcherOnMount: Dispatcher = {
  readContext,

  use,
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useInsertionEffect: mountInsertionEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: mountDeferredValue,
  useTransition: mountTransition,
  useSyncExternalStore: mountSyncExternalStore,
  useId: mountId,
  useHostTransitionStatus: useHostTransitionStatus,
  useFormState: mountActionState,
  useActionState: mountActionState,
  useOptimistic: mountOptimistic,
  useMemoCache,
  useCacheRefresh: mountRefresh,
};
const HooksDispatcherOnUpdate: Dispatcher = {
  readContext,

  use,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  useDebugValue: updateDebugValue,
  useDeferredValue: updateDeferredValue,
  useTransition: updateTransition,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,
  useHostTransitionStatus: useHostTransitionStatus,
  useFormState: updateActionState,
  useActionState: updateActionState,
  useOptimistic: updateOptimistic,
  useMemoCache,
  useCacheRefresh: updateRefresh,
};
~~~

这里有非常多的hooks实现，但是内部原理都大差不差，这里笔者主要分析几个典型的hooks。

在阅读hooks的原理之前，我们需要先弄清楚hook的结构：

~~~ts
export type Hook = {
  /*
  	作用：当前 Hook 的最终状态值（比如 useState 的 state）
	这是组件渲染结束后，这个 Hook 的最新值，React 下次渲染会从这里开始读取。
  */
  memoizedState: any,
    
  /*
  	作用：本次更新前的基础状态
	用于处理多个更新跳过时的“上一个有效值”。
	在某些跳过渲染或优先级变动时，它可以帮助重新恢复 base 状态。
  */ 
  baseState: any,
    
  /*
  	作用：记录未完成更新的队列（跳过的）
	类型是 Update<any, any> | null
	如果某次 render 因优先级未到而被跳过，这些 Update 会保留在 baseQueue，等待下一轮重新处理。
	多用于并发更新恢复。
  */
  baseQueue: Update<any, any> | null,
    
  /*
  	作用：包含所有 update 的管理对象（含 dispatch）
  	内部结构：
  		{
		  pending: Update | null; // 链表（即将处理的更新）
		  dispatch: Function;     // 比如 setState 本身
		  lastRenderedReducer?: Function;
		  lastRenderedState?: any;
		}
  */
  queue: any,
    
  /*
  	作用：指向下一个 Hook，构成链表
	React 通过 Hook.next 一直向后遍历，处理组件中的每一个 Hook。
  */
  next: Hook | null,
};
~~~

~~~ts
fiber.
memorizedState
 ↓
Hook0 → Hook1 → Hook2 → null
│        │        │
│        │        └── memoizedState: ...
│        └── memoizedState: ...
└── memoizedState: ...
~~~

#### useState

##### 挂载逻辑

在这个hooks中，我们主要关注`memorizedState`。假设是刚创建的组件：

~~~tsx
functiom MyComponent(){
    const [count, setCount] = useState(0);
    return <div>{count}</div>
}
~~~

那么我们此时的`memorizedState`肯定是没有的，于是`ReactSharedInternals.H = HooksDispatcherOnMount`，从而得到`useState = mountState`。

~~~ts
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 首先初始化hook
  const hook = mountStateImpl(initialState);
  const queue = hook.queue;
  // 这里将组件的更新逻辑绑定至dispatch里
  // 这里我们要注意一点，因为dispatchSetState的第三个参数是action，然后绑定了两个参数，所以下次我们调用dispath(something)时，这个something就是action
  const dispatch: Dispatch<BasicStateAction<S>> = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any);
  queue.dispatch = dispatch;
  return [hook.memoizedState, dispatch];
}
~~~

- **mountStateImpl**

  ~~~ts
  function mountStateImpl<S>(initialState: (() => S) | S): Hook {
    // 新建一个hook挂入hooks链表上，并返回
    const hook = mountWorkInProgressHook();
    if (typeof initialState === 'function') {
      const initialStateInitializer = initialState;
      initialState = initialStateInitializer();
    }
    hook.memoizedState = hook.baseState = initialState;
    // 初始化一个queue
    const queue: UpdateQueue<S, BasicStateAction<S>> = {
      pending: null,
      lanes: NoLanes,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: (initialState: any),
    };
    hook.queue = queue;
    return hook;
  }
  
  function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
      memoizedState: null,
  
      baseState: null,
      baseQueue: null,
      queue: null,
  
      next: null,
    };
  
    if (workInProgressHook === null) {
      // currentlyRenderingFiber就是当前工作Fiber，可以参考上面的renderWithHooks函数
      // 如果此时的工作hook不存在，那么设置hook链表头，并挂载在当前Fiber的memorizedState上
      currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
    } else {
      // 此时的工作hook链表存在，那么添加至hooks链表尾部
      // 这里有的读者可能会疑惑，为什么我们能确定workInProgressHook是hooks链表的最后一个节点？参见 注意
      workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook;
  }
  ~~~

  > **注意**
  >
  > 解释一下`workInProgressHook.next = hook`为什么能确定`workInProgressHook就是链表尾`，比如：
  >
  > ~~~ts
  > const [count, setCount] = useState(0);
  > const [flag, setFlag] = useState(true);
  > const [str, setStr] = useState('react');
  > ~~~
  >
  > 在生成hook的阶段，我们肯定是从一个空hooks链表开始构建，然后依次将上述三个hook添加到链表中。

- **dispatchSetState**

  ~~~ts
  function dispatchSetState<S, A>(
    fiber: Fiber,
    queue: UpdateQueue<S, A>,
    action: A,
  ): void {
    const lane = requestUpdateLane(fiber);
    const didScheduleUpdate = dispatchSetStateInternal(
      fiber,
      queue,
      action,
      lane,
    );
  }
  
  function dispatchSetStateInternal<S, A>(
    fiber: Fiber,
    queue: UpdateQueue<S, A>,
    action: A,
    lane: Lane,
  ): boolean {
    const update: Update<S, A> = {
      lane,
      revertLane: NoLane,
      gesture: null,
      action,
      hasEagerState: false,
      eagerState: null,
      next: (null: any),
    };
  
    // 将update推入queue.pending中，这里的调用链有点隐蔽
    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    if (root !== null) {
      // 此处将hooks变化与组件更新绑定起来
      scheduleUpdateOnFiber(root, fiber, lane);
      return true;
    }
    return false;
  }
  ~~~
  
  ~~~ts
  // 这里我们来看一下enqueueConcurrentHookUpdate
  
  // 这是全局并发队列，我们现在的首要任务就是找出其与update.queue.pending的关联
  const concurrentQueues = [];
  
  export function enqueueConcurrentHookUpdate<S, A>(
    fiber: Fiber,
    queue: HookQueue<S, A>,
    update: HookUpdate<S, A>,
    lane: Lane,
  ): FiberRoot | null {
    const concurrentQueue: ConcurrentQueue = (queue: any);
    const concurrentUpdate: ConcurrentUpdate = (update: any);
    enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
    return getRootForUpdatedFiber(fiber);
  }
  
  // 这里将任务加入全局并发队列
  function enqueueUpdate(
    fiber: Fiber,
    queue: ConcurrentQueue | null,
    update: ConcurrentUpdate | null,
    lane: Lane,
  ) {
    concurrentQueues[concurrentQueuesIndex++] = fiber;
    concurrentQueues[concurrentQueuesIndex++] = queue;
    concurrentQueues[concurrentQueuesIndex++] = update;
    concurrentQueues[concurrentQueuesIndex++] = lane;
  
    concurrentlyUpdatedLanes = mergeLanes(concurrentlyUpdatedLanes, lane);
  
    fiber.lanes = mergeLanes(fiber.lanes, lane);
    const alternate = fiber.alternate;
    if (alternate !== null) {
      alternate.lanes = mergeLanes(alternate.lanes, lane);
    }
  }
  
  // 这里就是将全局并发队列与update.queue.pending关联的逻辑
  // 也就是说，我们只需要找到在何处调用finishQueueingConcurrentUpdates就可知道更新队列是在哪构建的了
  export function finishQueueingConcurrentUpdates(): void {
    const endIndex = concurrentQueuesIndex;
    concurrentQueuesIndex = 0;
  
    concurrentlyUpdatedLanes = NoLanes;
  
    let i = 0;
    while (i < endIndex) {
      const fiber: Fiber = concurrentQueues[i];
      concurrentQueues[i++] = null;
      const queue: ConcurrentQueue = concurrentQueues[i];
      concurrentQueues[i++] = null;
      const update: ConcurrentUpdate = concurrentQueues[i];
      concurrentQueues[i++] = null;
      const lane: Lane = concurrentQueues[i];
      concurrentQueues[i++] = null;
  
      if (queue !== null && update !== null) {
        const pending = queue.pending;
        if (pending === null) {
          update.next = update;
        } else {
          update.next = pending.next;
          pending.next = update;
        }
        queue.pending = update;
      }
  
      if (lane !== NoLane) {
        markUpdateLaneFromFiberToRoot(fiber, update, lane);
      }
    }
  }
  ~~~
  
  > 通过对`enqueueConcurrentHookUpdate`的分析，我们知道只需要找到在何处调用`finishQueueingConcurrentUpdates`，就知道在何处将我们hooks的更新添加到待更新队列中，比较典型的一个就是在我们的调用主路径（可参考[React虚拟DOM更新解析](https://www.unstoppable840.cn/article/00871eb1-d110-42c7-a67d-4e0f7c1d34e3)）中的`renderRootConcurrent`函数：
  >
  > ~~~ts
  > function renderRootConcurrent(root: FiberRoot, lanes: Lanes) {
  >  	if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
  >  	    prepareFreshStack(root, lanes);
  >  	}
  > }
  > 
  > function prepareFreshStack(root: FiberRoot, lanes: Lanes): Fiber {
  >     // ...
  >     finishQueueingConcurrentUpdates();
  > }
  > ~~~
  >
  > 从这里我们可以知道`finishQueueingConcurrentUpdates`被调用的位置了，但是有的读者可能会疑惑，不是在`workInProgressRoot !== root`的时候才调用吗？如果我渲染过一次，那之后更新是不是就不调用了？
  >
  > 首先我们需要明确`workInProgressRoot !== root`表示的是**首次渲染**，这不是我们用户角度的`mount`，而是每次更新都会执行**首次渲染**，因为在每次commitWork之后都会将`workInProgress`清空：
  >
  > ~~~ts
  > function commitRoot(...){
  >   if (root === workInProgressRoot) {
  >     // We can reset these now that they are finished.
  >     workInProgressRoot = null;
  >     workInProgress = null;
  >     workInProgressRootRenderLanes = NoLanes;
  >   }
  > }
  > ~~~

经历了`mountState`函数后，我们生成了一个完整的hooks链表，并挂载至当前工作节点fiber上，然后返回的`dispatch`中调用了`scheduleUpdateOnFiber`表示hooks与组件更新的连接。

现在我们还需要弄清楚一件事，state是如何绑定到JSX上的？

实际上就是通过我们所写的函数式组件在`renderWithHooks`里作为`Component`被执行了，而内部有我们写的关于state的使用逻辑：

~~~tsx
functiom MyComponent(){
    const [count, setCount] = useState(0);
    // 这里count为hook.memoizedState, setCount为dispatch
    return <div>{count}</div>
}
~~~

关于`mount`的逻辑已经讲完了，下面来看看更新逻辑。

##### 更新逻辑

当拥有`memoizedState`时`renderWithHooks`进入`HooksDispatcherOnUpdate`，此时我们来看看更新逻辑下的`useState`：

~~~ts
function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, initialState);
}

// 用于支持setCount((oldState)=>oldState+1)或者setCount(1)的写法
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}
~~~

- **updateReducer**

  ~~~ts
  function updateReducer<S, I, A>(
    reducer: (S, A) => S,
    initialArg: I,
    init?: I => S,
  ): [S, Dispatch<A>] {
    // 新建hook并插入到hooks链表中
    const hook = updateWorkInProgressHook();
    return updateReducerImpl(hook, ((currentHook: any): Hook), reducer);
  }
  
  /*
  	hook存储在fiber的 memoizedState 字段中，以链表形式存在。
  	currentHook属于当前的fiber。
  	workInProgressHook是一个将添加到work-in-progress的fiber中的新链表。
  */
  let currentHook: Hook | null = null;
  let workInProgressHook: Hook | null = null;
  
  // 这里的逻辑和mount的有一点差别，其利用全局变量currentHook来实现hooks链表的构建
  function updateWorkInProgressHook(): Hook {
    let nextCurrentHook: null | Hook;
    
    // 简单来说，nextCurrentHook指向老hooks链表
    if (currentHook === null) {
      const current = currentlyRenderingFiber.alternate;
      if (current !== null) {
        nextCurrentHook = current.memoizedState;
      } else {
        nextCurrentHook = null;
      }
    } else {
      nextCurrentHook = currentHook.next;
    }
  
    // nextWorkInProgressHook指向新hooks链表
    let nextWorkInProgressHook: null | Hook;
    if (workInProgressHook === null) {
      nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
    } else {
      nextWorkInProgressHook = workInProgressHook.next;
    }
  
    if (nextWorkInProgressHook !== null) {
      workInProgressHook = nextWorkInProgressHook;
      nextWorkInProgressHook = workInProgressHook.next;
  
      currentHook = nextCurrentHook;
    } else {
      if (nextCurrentHook === null) {
        const currentFiber = currentlyRenderingFiber.alternate;
      }
  
      currentHook = nextCurrentHook;
        
      // 新hook基于老hook重建hook
      const newHook: Hook = {
        memoizedState: currentHook.memoizedState,
  
        baseState: currentHook.baseState,
        baseQueue: currentHook.baseQueue,
        queue: currentHook.queue,
  
        next: null,
      };
  
      // 在mount阶段解释过
      if (workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
      } else {
        workInProgressHook = workInProgressHook.next = newHook;
      }
    }
    return workInProgressHook;
  }
  
  function updateReducerImpl<S, A>(
    hook: Hook,
    current: Hook,
    reducer: (S, A) => S,
  ): [S, Dispatch<A>] {
    const queue = hook.queue;
  
    // 本来这是useReducer里的reducer，但是用于useState时就为basicStateReducer了
    queue.lastRenderedReducer = reducer;
  
    // 在前文介绍过，这是被跳过执行的更新
    let baseQueue = hook.baseQueue;
    // 前文也介绍过，是即将处理的更新
    const pendingQueue = queue.pending;
    if (pendingQueue !== null) {
      if (baseQueue !== null) {
        const baseFirst = baseQueue.next;
        const pendingFirst = pendingQueue.next;
        baseQueue.next = pendingFirst;
        pendingQueue.next = baseFirst;
      }
      // 先执行queue.padding里的更新，将baseQueue移至下一次更新
      current.baseQueue = baseQueue = pendingQueue;
      queue.pending = null;
    }
  
    const baseState = hook.baseState;
    if (baseQueue === null) {
      hook.memoizedState = baseState;
    } else {
      // 存在待更新队列
      const first = baseQueue.next;
      let newState = baseState;
  
      let newBaseState = null;
      let newBaseQueueFirst = null;
      let newBaseQueueLast: Update<S, A> | null = null;
      let update = first;
      let didReadFromEntangledAsyncAction = false;
      // 遍历更新队列里的所有更新
      do {
        const updateLane = removeLanes(update.lane, OffscreenLane);
        const isHiddenUpdate = updateLane !== update.lane;
  
        let shouldSkipUpdate = isHiddenUpdate
          ? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
          : !isSubsetOfLanes(renderLanes, updateLane);
  
        // 根据优先级判断是不是不该本次执行，如果是则将更新添加至hook.baseQueue
        if (shouldSkipUpdate) {
          const clone: Update<S, A> = {
            lane: updateLane,
            revertLane: update.revertLane,
            gesture: update.gesture,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: (null: any),
          };
          if (newBaseQueueLast === null) {
            newBaseQueueFirst = newBaseQueueLast = clone;
            newBaseState = newState;
          } else {
            newBaseQueueLast = newBaseQueueLast.next = clone;
          }
          currentlyRenderingFiber.lanes = mergeLanes(
            currentlyRenderingFiber.lanes,
            updateLane,
          );
          markSkippedUpdateLanes(updateLane);
        // 如果优先级够，需要执行更新
        } else {
          // 这里的action实际上就是useState(1)或useState(()=>1)里的1或者()=>1，可以参考mount阶段的mountStateImpl函数的实现
          const action = update.action;
          // 执行basicStateReducer
          newState = reducer(newState, action);
        }
        update = update.next;
      } while (update !== null && update !== first);
  
      if (newBaseQueueLast === null) {
        newBaseState = newState;
      } else {
        newBaseQueueLast.next = (newBaseQueueFirst: any);
      }
  
      // 更新hook的一些状态
      hook.memoizedState = newState;
      hook.baseState = newBaseState;
      hook.baseQueue = newBaseQueueLast;
  
      queue.lastRenderedState = newState;
    }
  
    const dispatch: Dispatch<A> = (queue.dispatch: any);
    return [hook.memoizedState, dispatch];
  }
  ~~~
  
  > 关于`updateReducerImpl`的核心逻辑就是，遍历baseQueue，然后执行update.action，也就是更新`memorizedState`，然后供给函数组件内部使用，后续逻辑可以参考mount阶段。

现在我们利用图片来描述一下这个过程：

![](.\images\无标题-2025-07-22-1817.png)

#### useEffect

同样，在进入查看之前我们先弄清楚`effect`的结构：

~~~ts
export type Effect = {
  tag: HookFlags,
  inst: EffectInstance,  // 对应组件实例（多数场景为 null）
  create: () => (() => void) | void,  // useEffect 的回调函数（可能返回清理函数）
  deps: Array<mixed> | void | null,  // useEffect 的依赖项
  next: Effect,  // 指向下一个 Effect（形成环形链表）
};
~~~

##### 挂载逻辑

~~~ts
function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  mountEffectImpl(
      PassiveEffect | PassiveStaticEffect,  // 非阻塞的异步副作用标识
      HookPassive,
      create,
      deps,
  );
}

function mountEffectImpl(
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  // 创建hook，并添加到fiber的hooks链表末尾
  const hook = mountWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
      
  // 将hook的memorizedState挂载effect链表
  hook.memoizedState = pushSimpleEffect(
    HookHasEffect | hookFlags,
    createEffectInstance(),
    create,
    nextDeps,
  );
}

function pushSimpleEffect(
  tag: HookFlags,
  inst: EffectInstance,
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): Effect {
  const effect: Effect = {
    tag,
    create,
    deps,
    inst,
    next: (null: any),
  };
  return pushEffectImpl(effect);
}

function pushEffectImpl(effect: Effect): Effect {
  let componentUpdateQueue: null | FunctionComponentUpdateQueue =
    (currentlyRenderingFiber.updateQueue: any);
  
  // 如果fiber的updateQueue不存在，为fiber创建updateQueue
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
  }
  
  const lastEffect = componentUpdateQueue.lastEffect;
  
  // 构建effect环形链表
  if (lastEffect === null) {
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }
  return effect;
}
~~~

看到这里，读者可能会疑惑，这里只是创建了`effect`环形链表添加到`fiber.updateQueue`上，并没有执行啊？这个疑惑是对的，我们稍微回想一下，`useEffect`是不是一般都是`dom`生成后才执行的？所以我们可以猜测这些`effect`是在`commitWork`阶段被执行的。实际上也确实是：

~~~ts
function commitRoot(){
    // ...
    flushPendingEffects();
}
function flushPendingEffects(){
    // ...
    flushPassiveEffectsImpl();
}
function flushPassiveEffectsImpl(){
    // ...
    commitPassiveMountEffects();
}

function commitPassiveMountOnFiber(
  finishedRoot: FiberRoot,
  finishedWork: Fiber,
  committedLanes: Lanes,
  committedTransitions: Array<Transition> | null,
  endTime: number,
): void {
	const flags = finishedWork.flags;
  	switch (finishedWork.tag) {
  	  case FunctionComponent:{
        // 递归处理，使所有子fiber的effect都被执行到
  	    recursivelyTraverseLayoutEffects(
  	      finishedRoot,
  	      finishedWork,
  	      committedLanes,
  	    );
         
  	    if (flags & Passive) {
        	commitHookPassiveMountEffects(
        	  finishedWork,
        	  HookPassive | HookHasEffect,
        	);
      	}
  	    break;
  	  }
   }        
}

export function commitHookPassiveMountEffects(
  finishedWork: Fiber,
  hookFlags: HookFlags,
) {
  commitHookEffectListMount(hookFlags, finishedWork);
}


export function commitHookEffectListMount(
  flags: HookFlags,
  finishedWork: Fiber,
) {
  try {
    // 从updateQueue中取出effect队列
    const updateQueue: FunctionComponentUpdateQueue | null =
      (finishedWork.updateQueue: any);
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
      const firstEffect = lastEffect.next;
      let effect = firstEffect;
      // 循环执行
      do {
        // 只有HookPassive | HookHasEffect才可以进入此分支，单独HookPassive或HookHasEffect都不行
        if ((effect.tag & flags) === flags) {
          // Mount
          let destroy;
          const create = effect.create;
          const inst = effect.inst;
          destroy = create();
          inst.destroy = destroy;
        }
        effect = effect.next;
      } while (effect !== firstEffect);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
~~~

这就保证挂载的时候`effect`能被调用了，那么我们根据不同`deps`实现不同`useEffect`的逻辑在哪呢？主要是看**更新逻辑**。

一些工具函数：

- **createFunctionComponentUpdateQueue**

  ~~~ts
  function createFunctionComponentUpdateQueue(): FunctionComponentUpdateQueue {
    return {
      lastEffect: null,
      events: null,
      stores: null,
      memoCache: null,
    };
  }
  ~~~

- **recursivelyTraverseLayoutEffects**

  ~~~ts
  function recursivelyTraverseLayoutEffects(
    root: FiberRoot,
    parentFiber: Fiber,
    lanes: Lanes,
  ) {
    if (parentFiber.subtreeFlags & LayoutMask) {
      let child = parentFiber.child;
      while (child !== null) {
        const current = child.alternate;
        commitLayoutEffectOnFiber(root, current, child, lanes);
        child = child.sibling;
      }
    }
  }
  ~~~

##### 更新逻辑

~~~ts
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImpl(
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  // 老生常谈了
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const effect: Effect = hook.memoizedState;
  const inst = effect.inst;

  // 如果一开始就有useEffect
  if (currentHook !== null) {
    // 并且此时deps不为空
    if (nextDeps !== null) {
      const prevEffect: Effect = currentHook.memoizedState;
      const prevDeps = prevEffect.deps;
      // 比较依赖是否一致
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // hookFlags为HookPassive，这样并不会在下次commitWork执行，参考前文的commitHookEffectListMount函数
        hook.memoizedState = pushSimpleEffect(
          hookFlags,
          inst,
          create,
          nextDeps,
        );
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;

  // 在下次commitWork执行
  hook.memoizedState = pushSimpleEffect(
    HookHasEffect | hookFlags,
    inst,
    create,
    nextDeps,
  );
}

/*
	这里就可以看到根据deps不同而致使useEffect行为不同的逻辑：
	currentHook !== null -> deps !== null -> areHookInputsEqual(nextDeps, prevDeps) -> 不执行
	其他情况都执行
*/
~~~

到这里我们就将useEffect介绍完毕了。

### 参考文献

[React源码](https://github.com/facebook/react/)

