### 导读

本篇文章是属于[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)合集的一个章节，[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)帮助读者剖析react源码，从fiber节点、lane调度优先级控制、微任务调度、虚拟dom更新机制、常见hooks源码解析等，帮助读者理解react设计架构与优化机制，让react的进阶不再困难，让前端能力的提升没有瓶颈。

### React虚拟DOM更新解析

react的核心就是虚拟dom的更新，为了更全面的认识react的虚拟dom更新逻辑，本篇文章将从**初始树的创建**以及**state变化触发组件更新**两个阶段作为案例，去理解初始创建时react的虚拟dom是如何构造的，以及state变化后，虚拟dom是如何更新的。

#### 前置介绍

在进入案例之前，我们需要弄清楚一些前置问题：

- 从我们写的JSX到真实DOM是如何转变的
- 以及React底层的Fiber更新原理

##### workInProgress

因为后续经常会用到`workInProgress`，所以在这里提前给读者介绍一下`workInProgress`是什么：

~~~ts
// The fiber we're working on
let workInProgress: Fiber | null = null;
~~~

上面是React里的源码，也就是说`workInProgress`就是Fiber，大家就把这个概念记住，在后面阅读时就会轻松许多。

另外再多介绍一点：

~~~
FiberNode: current
   |
   └── alternate --> FiberNode: workInProgress
~~~

体现在源码：

~~~ts
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
	// ...
    workInProgress.alternate = current;
    current.alternate = workInProgress;
}
~~~

也就是说`Fiber.alternate`属性指向的就是工作中的Fiber——`workInProgress`。

##### DOM节点如何转换为Fiber节点

**一般来说，react不会有将DOM节点转换为Fiber节点的工作流**。我们可以回忆一下react的工作流，我们写的都是JSX，而这些JSX构建的都是虚拟DOM，所以在大部分情况我们不会先生成真实DOM再生成Fiber。但是有没有先生成真实DOM再生成Fiber的情况呢，确实有，那就是我们初始化root节点的时候，一般会利用`createRoot(真实DOM)`来挂载DOM节点，这个过程就有将真实DOM转换为Fiber的情况，具体如何转换的如下：

首先react调用了一个`createFiber`函数：

~~~ts
const createFiber = enableObjectFiber
  ? createFiberImplObject
  : createFiberImplClass;
~~~

在react中，Fiber有两种形式，对象和类，一般来讲我们用对象fiber比较多，所以这里只对`createFiberImplObject`做介绍。

```ts
function createFiberImplObject(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
): Fiber {
  const fiber: Fiber = {
    // Instance
    // tag, key - defined at the bottom as dynamic properties
    elementType: null,
    type: null,
    stateNode: null,

    // Fiber
    return: null,
    child: null,
    sibling: null,
    index: 0,

    ref: null,
    refCleanup: null,

    // pendingProps - defined at the bottom as dynamic properties
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,
    dependencies: null,

    // Effects
    flags: NoFlags,
    subtreeFlags: NoFlags,
    deletions: null,

    lanes: NoLanes,
    childLanes: NoLanes,

    alternate: null,

    // dynamic properties at the end for more efficient hermes bytecode
    tag,
    key,
    pendingProps,
    mode,
  };

  if (enableProfilerTimer) {
    fiber.actualDuration = -0;
    fiber.actualStartTime = -1.1;
    fiber.selfBaseDuration = -0;
    fiber.treeBaseDuration = -0;
  }
  return fiber;
}
```

上述代码很简单，就是创建一个空的Fiber对象，然后react还对其作了什么呢？

~~~ts
 const root: FiberRoot = (new FiberRootNode(
    containerInfo,
    tag,
    hydrate,
    identifierPrefix,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator,
    formState,
  ): any);

const uninitializedFiber = createHostRootFiber(tag, isStrictMode);  // 这里的createHostRootFiber就是实际调用createFiber，返回的就是空Fiber对象
root.current = uninitializedFiber;
uninitializedFiber.stateNode = root;
const initialCache = createCache();
retainCache(initialCache);
// ...
uninitializedFiber.memoizedState = initialState;
initializeUpdateQueue(uninitializedFiber);
~~~

所以绑定root具体对Fiber做了以下操作：

- 挂载`FiberRoot`到`stateNode`
- 设置`memoizedState`为`initialState`
- 初始化`updateQueue`

##### JSX转换为真实DOM

我们须知，react从我们写的JSX到真实DOM一共经历了三个阶段：

- 构建Fiber树 —— `beginWork()`

  根据我们写的JSX，生成Fiber树

- 保存DOM引用 ——` completeWork()`

  为每个代表真实DOM的Fiber`（fiber.tag===HostComponent）`创建真实DOM实例挂载到stateNode上

- 插入DOM —— `commitWork()`

  将Fiber上的DOM挂载到我们的DOM树上

下面我们将一一剖析这些函数（会删减代码致保持理解的最低限度，因为只探究Fiber转换为真实DOM的流，所以只保留`HostComponent`的情况）：

###### beginWork

~~~ts
function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate;
  let next;
  next = beginWork(current, unitOfWork, entangledRenderLanes);
  if (next === null) {
    // 这里是横向处理
    completeUnitOfWork(unitOfWork);
  } else {
    // 这里是纵向处理
    workInProgress = next;
  }
}
~~~

~~~ts
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
	switch (workInProgress.tag) {
	   case HostComponent:
      		return updateHostComponent(current, workInProgress, renderLanes);
	}
}
~~~

~~~ts
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  // ...
  // 这里是真正的生成Fiber树的逻辑
  let nextChildren = nextProps.children;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
~~~

~~~ts
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes,
) {
   // 调用reconcileChildFibers
   workInProgress.child = reconcileChildFibers(
   workInProgress,
   current.child,
   nextChildren,
   renderLanes,
   );
}
~~~

调用栈到`reconcileChildFibers`开始真正进入处理逻辑：

~~~ts
function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    const firstChildFiber = reconcileChildFibersImpl(
      returnFiber,
      currentFirstChild,
      newChild,
      lanes,
    );
    return firstChildFiber;
}
function reconcileChildFibersImpl(
   returnFiber: Fiber,
   currentFirstChild: Fiber | null,
   newChild: any,
   lanes: Lanes,
 ): Fiber | null {
     // 处理新子节点只有一个节点的时候，比如 [<></>]
     switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
              const firstChild = reconcileSingleElement(
           		 returnFiber,
           		 currentFirstChild,
           		 newChild,
           		 lanes,
     		  );
     }
    
     // 处理新子节点是数组的情况,比如[<div></div>,<div></div>]
     if (isArray(newChild)) {
         const firstChild = reconcileChildrenArray(
        	returnFiber,
        	currentFirstChild,
        	newChild,
        	lanes,
      	  );
     }
     return firstChild;
}

function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  // 下次渲染时要添加的子节点，ReactElement是我们JSX语法转换成正常代码的形式
  /*
  类似如下结构：
  	{
  		type: 'div',
  		key: null,
  		ref: null,
  		props: {
    		className: 'box',
    		children: 'Hello'
  		},
  	}
  */
  element: ReactElement,
  lanes: Lanes,
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  while (child !== null) {
    if (child.key === key) {
      // 由于新的子节点链表只有一个子节点，所以只需要匹配一个就行了，后面的全部删除
      deleteRemainingChildren(returnFiber, child.sibling);
      // 复用当前子节点
      const existing = useFiber(child, element.props);
      // 这是用于useRef的，设置ref
      coerceRef(existing, element);
      existing.return = returnFiber;
      return existing;
    // key不一致直接全部销毁
    } else {
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }
      
  // 原来不存在child，则新建child
  // 这里是根据JSX转换成Fiber
  const created = createFiberFromElement(element, returnFiber.mode, lanes);
  coerceRef(created, element);
  created.return = returnFiber;
  return created;
}

function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<any>,
  lanes: Lanes,
): Fiber | null {
  let knownKeys: Set<string> | null = null;

  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    // 找出当前oldFiber的下一个兄弟，用于迭代
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    // 进行key比较，并返回更新后的节点
    // 线性比较，发现key不同则返回null
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes,
    );
    // 比较过程中，老节点和新节点的key不同
    if (newFiber === null) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }

    // 给节点打上移动标签，如果新节点的相对位置有过移动，则标记移动过，这个过程在commitWork执行
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    
    // 将更新后的Fiber连成一个链表
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    // oldFiber进行迭代
    oldFiber = nextOldFiber;
  }

  // 移动长度为如果新节点链表的长度（表示已经将新节点都处理完了，老节点和新节点key都相同），则把老节点链表之后的节点全删了
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  // 如果老节点链表为空，遍历新节点链表创建Fiber
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
      if (newFiber === null) {
        continue;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  // 新节点并没有比较完，此时老节点也有剩余，那就处于乱序状态，这时候将剩余的老节点用map整理，方便 重排复用
  const existingChildren = mapRemainingChildren(oldFiber);

  for (; newIdx < newChildren.length; newIdx++) {
    // 从剩余的老节点找到可复用的节点
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes,
    );
    // 匹配到key，可复用时
    if (newFiber !== null) {
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      // 构建新节点链表
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }
  // 返回新节点链表头
  return resultingFirstChild;
}
~~~

下面是上述代码的一个完整调用链：

![](.\images\无标题-2025-07-18-0824.png)

简单来说，上面的工作流就是通过`beginWork`代理生成某个Fiber节点的新子节点链表。

但是读者可能会疑惑，React貌似在一次`beginWork`中并没有深层去生成子树啊！读者的疑惑是对的，这也是React的优化之一，**将子树的生成进行拆分，每次beginWork只负责生成一个节点的子节点链表，这样就可以将子树的生成拆解成多个微任务**，每次需要调度处理的工作量就大大减少了，这样页面的渲染看起来就更加连贯。

具体来讲我们可以看到`performUnitOfWork`函数，他是一个调度执行单元，是一个循环函数，其从`beginWork`中获取到儿子链表头，根据儿子链表头的存在情况确认进入横向处理还是纵向处理（**确认`workInProgress`为子节点还是兄弟节点，然后进入循环`beginWork`**），确保每个子节点都能被处理，生成一个完整的子树。

上面还有几个小问题，`placeChild`、`deleteChild`都是需要涉及真实DOM的操作，不过在这个阶段都只是做了个记号，并没有真正实施DOM操作，这些操作会延迟至`commitWork`阶段时才执行，实际上由于`newChild`的链表是通过遍历`newChild`构建出来的，所以在Fiber树上不会出现问题，而`placeChild`、`deleteChild`主要是用于之后的真实DOM结构修改。

下面是关于React的`diff`图解：

先给出我们正常的一个子节点链表和父节点间的关系，其中`returnFiber`为父节点：

![](.\images\Snipaste_2025-07-18_13-26-39.jpg)

- 首先是第一种情况：

  也是理想情况，只是末尾出现删除，顺序没变。

  ![](.\images\Snipaste_2025-07-18_13-52-26.jpg)

- 第二种情况：

  顺序发生改变。

  ![](.\images\Snipaste_2025-07-18_13-54-04.jpg)

  此时为oldChild构造一个map，然后根据map进行复用。

  ![](.\images\Snipaste_2025-07-18_13-54-25.jpg)

  

以上就是React的`diff`算法。

其他的一些工具函数：

- **completeUnitOfWork**

  `performUnitOfWork`进行横向子树生成的逻辑，同时包含`completeWork()`阶段。

  ~~~ts
  function completeUnitOfWork(unitOfWork: Fiber): void {
    let completedWork: Fiber = unitOfWork;
    do {
      const current = completedWork.alternate;
      const returnFiber = completedWork.return;
  
      let next;
      startProfilerTimer(completedWork);
      next = completeWork(current, completedWork, entangledRenderLanes);
      
      if (next !== null) {
        workInProgress = next;
        return;
      }
  
      const siblingFiber = completedWork.sibling;
      if (siblingFiber !== null) {
        workInProgress = siblingFiber;
        return;
      }
      completedWork = returnFiber;
      workInProgress = completedWork;
    } while (completedWork !== null);
  }
  ~~~

- **placeChild**

  用于标记需要替换位置的节点，在`commitWork()`阶段进行位置替换。

  ~~~ts
  function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number,
    newIndex: number,
  ): number {
    newFiber.index = newIndex;
    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        newFiber.flags |= Placement | PlacementDEV;
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;
      }
    } else {
      // This is an insertion.
      newFiber.flags |= Placement | PlacementDEV;
      return lastPlacedIndex;
    }
  }
  ~~~

  > 🔎 **举个例子**
  >
  > 假设旧 fiber 顺序是 `[A, B, C]`
  > 新的 JSX 顺序是 `[B, A, C]`
  >
  > ~~~ts
  > // newIndex = 0, key = "B"
  > placeChild(B, lastPlacedIndex = 0, newIndex = 0)  
  > // oldIndex = 1 → 放到前面了 → 打 Placement
  > 
  > // newIndex = 1, key = "A"
  > placeChild(A, lastPlacedIndex = 0, newIndex = 1)  
  > // oldIndex = 0 → 放到后面了 → 不需要动
  > 
  > // newIndex = 2, key = "C"
  > placeChild(C, lastPlacedIndex = 0, newIndex = 2)  
  > // oldIndex = 2 → 保持原位置
  > ~~~

- **updateSlot**

  这里是用于代理判断`newChild`和`oldChild`的key相不相等，并且进行Fiber复用或创建的逻辑。

  ~~~ts
  function updateSlot(
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    const key = oldFiber !== null ? oldFiber.key : null;
  
    // 分两种情况讨论，一个是新子节点是单个节点，另一种是新子节点是数组（为数组的情况一般是Fragment节点，<></>）
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          // key相同进行节点更新
          if (newChild.key === key) {
            const updated = updateElement(
              returnFiber,
              oldFiber,
              newChild,
              lanes,
            );
            return updated;
          } else {
            return null;
          }
        }
      }
  
      if (
        isArray(newChild) ||
        getIteratorFn(newChild) ||
        (enableAsyncIterableChildren &&
          typeof newChild[ASYNC_ITERATOR] === 'function')
      ) {
        if (key !== null) {
          return null;
        }
        // 更新Fragment节点
        const updated = updateFragment(
          returnFiber,
          oldFiber,
          newChild,
          lanes,
          null,
        );
        return updated;
      }
    return null;
  }
  
  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement,
    lanes: Lanes,
  ): Fiber {
    const elementType = element.type;
    if (current !== null) {
      if (
        current.elementType === elementType 
       
      ) {
        // 复用
        const existing = useFiber(current, element.props);
        coerceRef(existing, element);
        existing.return = returnFiber;
        return existing;
      }
    }
    // 插入
    const created = createFiberFromElement(element, returnFiber.mode, lanes);
    coerceRef(created, element);
    created.return = returnFiber;
    return created;
   }
          
  function updateFragment(
    returnFiber: Fiber,
    current: Fiber | null,
    fragment: Iterable<React$Node>,
    lanes: Lanes,
    key: null | string,
  ): Fiber {
    if (current === null || current.tag !== Fragment) {
      // 插入
      const created = createFiberFromFragment(
        fragment,
        returnFiber.mode,
        lanes,
        key,
      );
      created.return = returnFiber;
      return created;
    } else {
      // 复用
      const existing = useFiber(current, fragment);
      existing.return = returnFiber;
      return existing;
    }
  }
  ~~~

- **mapRemainingChildren**

  对`oldChild`生成`key/index`和Fiber的map。

  ~~~ts
  function mapRemainingChildren(
    currentFirstChild: Fiber,
  ): Map<string | number, Fiber> {
    const existingChildren: Map<string | number, Fiber> = new Map();
  
    let existingChild: null | Fiber = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }
  ~~~

- **updateFromMap**

  和`updateSlot`的职能类似，不过这个函数是根据`oldChild`生成`key/index`和Fiber的map来进行Fiber操作的。

  ~~~ts
   function updateFromMap(
      existingChildren: Map<string | number, Fiber>,
      returnFiber: Fiber,
      newIdx: number,
      newChild: any,
      lanes: Lanes,
    ): Fiber | null {
      // 和updateSlot类似，只不过existingChildren是老节点的map，用于乱序重排复用
      if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE: {
            const matchedFiber =
              existingChildren.get(
                newChild.key === null ? newIdx : newChild.key,
              ) || null;
            const prevDebugInfo = pushDebugInfo(newChild._debugInfo);
            const updated = updateElement(
              returnFiber,
              matchedFiber,
              newChild,
              lanes,
            );
            currentDebugInfo = prevDebugInfo;
            return updated;
          }
        }
  
        if (
          isArray(newChild) ||
          getIteratorFn(newChild) ||
          (enableAsyncIterableChildren &&
            typeof newChild[ASYNC_ITERATOR] === 'function')
        ) {
          const matchedFiber = existingChildren.get(newIdx) || null;
          const prevDebugInfo = pushDebugInfo(newChild._debugInfo);
          const updated = updateFragment(
            returnFiber,
            matchedFiber,
            newChild,
            lanes,
            null,
          );
          currentDebugInfo = prevDebugInfo;
          return updated;
        }
      }
      return null;
    }
  ~~~

- **deleteRemainingChildren**

  和`placeChild`类似，不进行真实操作，只是标记。

  ~~~ts
  function deleteRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
  ): null {
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }
  
  function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }
  ~~~

- **useFiber**

  复用Fiber的逻辑。
  
  ~~~ts
  function useFiber(fiber: Fiber, pendingProps: mixed): Fiber {
     const clone = createWorkInProgress(fiber, pendingProps);
     clone.index = 0;
     clone.sibling = null;
     return clone;
  }
  
  export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
    let workInProgress = current.alternate;
    if (workInProgress === null) {
      // createFiber以及在前面介绍过，就是创建一个空Fiber
      workInProgress = createFiber(
        current.tag,
        pendingProps,
        current.key,
        current.mode,
      );
  	// ...
    } else {
      // 复用
    }
    // ...
    return workInProgress;
  }
  ~~~

###### completeWork

前面讲`beginWork`的时候，我们已经知道了进入`completeWork`的工作流了（通过`performUnitOfWork`循环），下面我们就来介绍一下`completeWork`自己的工作流：

~~~ts
function completeWork(
  // 当前节点
  current: Fiber | null,
  // 当前节点的工作副本
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case HostComponent: {
      popHostContext(workInProgress);
      const type = workInProgress.type;
      // 如果节点存在，并且也挂载过真实DOM，执行更新逻辑
      if (current !== null && workInProgress.stateNode != null) {
        /* 
           React有两种更新DOM的方式，一个是突变更新(mutation)，一种是持久化更新（persistent）
           突变更新：直接修改原来的节点
           持久化更新：克隆一个新节点，再替换旧节点
        */
        // updateHostComponent主要是用于持久化更新的，在突变更新模式下不会进入，默认更新模式是突变更新
        // 那么真实DOM的更新在哪呢？——在commitWork阶段
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          renderLanes,
        );
      // 如果是新节点，则新挂载真实DOM
      }else {
          const rootContainerInstance = getRootHostContainer();
          // 用于创建当前节点真实DOM
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );
          /* 
             就是简单的遍历子节点真实DOM，添加到当前节点的真实DOM中
             还是老样子，只处理一层
             由于是自底向上，所以在当前节点创建真实DOM时，子节点的真实DOM已经创建完毕了，就能保证生成的真实DOM树是正确的
          */
          appendAllChildren(instance, workInProgress, false, false);
          // 挂载dom实例到stateNode上，在后续commitWork时会用到
          workInProgress.stateNode = instance;
      }
      return null;
    }
}
~~~

一些工具函数：

- **updateComponent**

  ~~~ts
  function updateHostComponent(
    current: Fiber,
    workInProgress: Fiber,
    type: Type,
    newProps: Props,
    renderLanes: Lanes,
  ) {
    if (supportsMutation) {
        const oldProps = current.memoizedProps;
        if (oldProps === newProps) {
          return;
        }
        // 标记更新，和placeChild类似，等到commitWork阶段才处理
        markUpdate(workInProgress);
    }
  }
  function markUpdate(workInProgress: Fiber) {
    workInProgress.flags |= Update;
  }
  ~~~

- **createInstance**

  ~~~ts
  export function createInstance(
    type: string,
    props: Props,
    rootContainerInstance: Container,
    hostContext: HostContext,
    internalInstanceHandle: Object,
  ): Instance {
    let hostContextProd: HostContextProd;
    const ownerDocument = getOwnerDocumentFromRootContainer(
      rootContainerInstance,
    );
  
    let domElement: Instance;
    switch (hostContextProd) {
          default: {
            domElement = ownerDocument.createElement(type);
          }
        }
    }
    precacheFiberNode(internalInstanceHandle, domElement);
    updateFiberProps(domElement, props);
    return domElement;
  }
  ~~~

- **appendAllChildren**

  ~~~ts
  function appendAllChildren(
    parent: Instance,
    workInProgress: Fiber,
    needsVisibilityToggle: boolean,
    isHidden: boolean,
  ) {
    if (supportsMutation) {
      let node = workInProgress.child;
      while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
          appendInitialChild(parent, node.stateNode);
        }
        while (node.sibling === null) {
          // 如果父节点不存在或者父节点为当前处理的父节点，那么处理结束
          if (node.return === null || node.return === workInProgress) {
            return;
          }
        }
        node.sibling.return = node.return;
        node = node.sibling;
      }
    }
  }
  
  function appendInitialChild(
    parentInstance: Instance,
    child: Instance | TextInstance,
  ): void {
    parentInstance.appendChild(child);
  }
  ~~~

###### commitWork

`commitWork`与前两个阶段的遍历方式有一点区别，`commitWork`使用的是`DFS`。

~~~ts
function commitMutationEffectsOnFiber(
  finishedWork: Fiber,
  root: FiberRoot,
  lanes: Lanes,
) {
  const prevEffectStart = pushComponentEffectStart();
  const prevEffectDuration = pushComponentEffectDuration();
  const prevEffectErrors = pushComponentEffectErrors();
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case HostComponent: {
      // 递归遍历所有节点执行commitWork，自底向上，并代理删除节点逻辑
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);

      // 根据之前placeChild做的标记，处理真实DOM的位置
      commitReconciliationEffects(finishedWork, lanes);

      if (flags & Ref) {
        if (!offscreenSubtreeWasHidden && current !== null) {
          safelyDetachRef(current, current.return);
        }
      }
      if (supportsMutation) {
        // 这里就是之前markUpdate后对应要处理的逻辑
        if (flags & Update) {
          const instance: Instance = finishedWork.stateNode;
          if (instance != null) {
            const newProps = finishedWork.memoizedProps;
            const oldProps =
              current !== null ? current.memoizedProps : newProps;
            commitHostUpdate(finishedWork, newProps, oldProps);
          }
        }
      }
      break;
    }
  }
}


~~~

**一些工具函数**：

- **recursivelyTraverseMutationEffects**

  递归（`DFS`）执行`commitWork`，并代理删除节点，是`deleteRemainingChildren`的延续。

  ~~~ts
  function recursivelyTraverseMutationEffects(
    root: FiberRoot,
    parentFiber: Fiber,
    lanes: Lanes,
  ) {
    const deletions = parentFiber.deletions;
    if (deletions !== null) {
      for (let i = 0; i < deletions.length; i++) {
        const childToDelete = deletions[i];
        commitDeletionEffects(root, parentFiber, childToDelete);
      }
    }
    if (
      parentFiber.subtreeFlags &
      (enablePersistedModeClonedFlag ? MutationMask | Cloned : MutationMask)
    ) {
      let child = parentFiber.child;
      while (child !== null) {
        commitMutationEffectsOnFiber(child, root, lanes);
        child = child.sibling;
      }
    }
  }
  
  function commitDeletionEffects(
    root: FiberRoot,
    returnFiber: Fiber,
    deletedFiber: Fiber,
  ) {
    const prevEffectStart = pushComponentEffectStart();
  
    if (supportsMutation) {
      let parent: null | Fiber = returnFiber;
      findParent: while (parent !== null) {
        switch (parent.tag) {
          case HostComponent: {
            hostParent = parent.stateNode;
            hostParentIsContainer = false;
            break findParent;
          }
        }
      }
      // 这里的调用栈很深，简单来说就是将真实DOM删除了，就不再一一列出了
      commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
      hostParent = null;
      hostParentIsContainer = false;
    }
  }
  ~~~

- **commitReconciliationEffects**

  节点位置移动逻辑，是之前`placeChild`的延续。

  ~~~ts
  function commitReconciliationEffects(
    finishedWork: Fiber,
    committedLanes: Lanes,
  ) {
    const flags = finishedWork.flags;
    if (flags & Placement) {
      commitHostPlacement(finishedWork);
      finishedWork.flags &= ~Placement;
    }
  }
  function commitPlacement(finishedWork: Fiber): void {
    // Recursively insert all host nodes into the parent.
    let hostParentFiber;
    let parentFragmentInstances = null;
    let parentFiber = finishedWork.return;
    
    // 找到最近的DOM祖先
    while (parentFiber !== null) {
      // 判断祖先Fiber是不是面向dom的Fiber还是根Fiber
      if (isHostParent(parentFiber)) {
        hostParentFiber = parentFiber;
        break;
      }
      parentFiber = parentFiber.return;
    }
  
    switch (hostParentFiber.tag) {
      case HostComponent: {
        const parent: Instance = hostParentFiber.stateNode;
        const before = getHostSibling(finishedWork);
  
        // 插入节点
        insertOrAppendPlacementNode(
          finishedWork,
          before,
          parent,
          parentFragmentInstances,
        );
        break;
      }
    }
  }
  
  function insertOrAppendPlacementNode(
    node: Fiber,
    before: ?Instance,
    parent: Instance,
    parentFragmentInstances: null | Array<FragmentInstanceType>,
  ): void {
    const {tag} = node;
    const isHost = tag === HostComponent || tag === HostText;
        
    // 插入组件节点
    if (isHost) {
      const stateNode = node.stateNode;
    	// 下面就是原始dom操作，insertBefore会默认删除原有的节点，实现的是替换效果
      if (before) {
        insertBefore(parent, stateNode, before);
      } else {
        appendChild(parent, stateNode);
      }
      if (enableFragmentRefs) {
        commitNewChildToFragmentInstances(node, parentFragmentInstances);
      }
      trackHostMutation();
      return;
    } 
  
    // 插入孩子节点，就是简单的递归遍历孩子树
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent, parentFragmentInstances);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(
          sibling,
          before,
          parent,
          parentFragmentInstances,
        );
        sibling = sibling.sibling;
      }
    }
  }
  ~~~

- **commitHostUpdate**

  节点更新逻辑，是之前`markUpdate`的延续。

  ~~~ts
  export function commitHostUpdate(
    finishedWork: Fiber,
    newProps: any,
    oldProps: any,
  ): void {
    // 这里就是根据oldProps和newProps的区别去操作真实dom了
    commitUpdate(
       finishedWork.stateNode,
       finishedWork.type,
       oldProps,
       newProps,
       finishedWork,
    );
  }
  ~~~

  其中`commitUpdate`、`insertBefore`、`appendChild`都属于操作真实DOM的函数，他们都从`ReactFiberConfig`引入，但我们在查看源码时会找不到这个文件，实际上这是React的配置化抽象，当运行于不同主机上时，`ReactFiberConfig`是动态发生调整的，一般如果我们以浏览器环境为准的话，可以去到`react\packages\react-reconciler\src\forks\ReactFiberConfig.dom.js`下查看到上述函数的实现。

至此，我们就将JSX转变为真实DOM的三个阶段给解析完毕了，下面将可视化表示出这个过程：

- 首先我们有一个JSX树

  ![](.\images\Snipaste_2025-07-21_13-23-52.jpg)

- 然后我们进入`beginWork`的纵向处理：

  ![](.\images\Snipaste_2025-07-21_13-26-30.jpg)

  每进入一个节点，就构建其子节点链表，并返回子节点链表头，然后以此作为`workInProgress`，以此深入处理，所以遍历了`root`->`firstChild-a-1`->`firstChild-b-1`。

- 进入`firstChild-a-1`并构建完子节点链表，此时返回`firstChild-b-1`，按理来说，我们也需要构建`firstChild-b-1`的子节点链表，但`firstChild-b-1`子节点链表返回为空，于是进入`completeUnitOfWork`，构建真实DOM：

  ![](.\images\Snipaste_2025-07-21_13-36-55.jpg)

  并向其兄弟拓展：

  ![](.\images\Snipaste_2025-07-21_13-38-14.jpg)

  然后将`firstChild-a-1`设置为`workInProgress`。

- 然后继续进入`completeUnitOfWork`：

  ![](.\images\Snipaste_2025-07-21_13-44-07.jpg)

  并延申至其兄弟，但这次情况有点特殊，其兄弟节点还有子节点，所以设置`sibling-a-1`为`workInProgress`。

- 此时`workInProgress`为`sibling-a-1`，进入`beginWork`：

  ![](.\images\Snipaste_2025-07-21_13-48-42.jpg)

  返回子节点`firstChild-c-1`并作为`workInProgress`。

- 由于`firstChild-c-1`的子节点为空，于是进入`completeUnitOfWork`：

  ![](.\images\Snipaste_2025-07-21_13-51-26.jpg)

  同样设置`sibling-c-1`为`workInProgress`。

- 此时`workInProgress`为`sibling-c-1`，进入`beginWork`：

  ![](.\images\Snipaste_2025-07-21_13-53-01.jpg)

- 后续就只剩`completeUnitOfWork`清扫了，走完兄弟节点走父节点：

  ![](.\images\Snipaste_2025-07-21_13-54-14.jpg)

- 自此我们所有Fiber节点的`stateNode`都构建好了，自底向上，所以每个`stateNode`都包含了完整的子树。至于`commitWork`阶段，其过程和前面两个阶段类似，这里就不再绘图了。

#### 初始树的创建

我们初始化一个React项目时，通常是这样：

~~~jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
~~~

那么我们来捋一下，render之后的调用栈：

![](.\images\20257211530.png)

在**前置介绍**小节中，我们观察到`updateHostComponent`逻辑中从Fiber的props里取到JSX转换得到的children，然后进行一系列转换变成了真实DOM，那么我们在这里需要弄清楚的是什么呢？

因为我们前面提到了，React将一棵组件树的渲染拆分成了多个微任务，每个微任务只处理某个节点及其子节点（一层），体现在`beginWork`中就是一个`workInProgress`，也就是说，我们需要弄清楚`workInProgress`是在哪添加的，我们在演绎`beginWork`和`completeWork`的绘图里可以发现，只要我们拥有某个位置的`workInProgress`，就能将该位置下的所有内容更新，体现在**初始树的创建**时，我们只需要设置`root`为`workInProgress`是不是就可以完整的生成整体的DOM树了呢？React就是这么做的。具体体现在`prepareFreshStack`的调用上：

~~~ts
function renderRootConcurrent(root: FiberRoot, lanes: Lanes){
     if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
         prepareFreshStack(root, lanes);
     }
}

function prepareFreshStack(root: FiberRoot, lanes: Lanes): Fiber {
  // ...
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  // ...
  return rootWorkInProgress;
}
~~~

至此，我们已经弄清楚了初始树的创建。

#### state变化触发组件更新

我们先观察一个简单的语法：

~~~tsx
function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
~~~

既然我们需要查看state变化后触发组件更新的逻辑，就需要先知道`useState`的实现原理：

~~~ts
export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

function resolveDispatcher() {
  const dispatcher = ReactSharedInternals.H;
  return ((dispatcher: any): Dispatcher);
}

const ReactSharedInternals =
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

import ReactSharedInternals from './ReactSharedInternalsClient';

export {
	ReactSharedInternals as __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
}
~~~

~~~ts
// ReactSharedInternalsClient文件
const ReactSharedInternals: SharedStateClient = ({
  H: null,
  A: null,
  T: null,
  S: null,
}: any);
if (enableGestureTransition) {
  ReactSharedInternals.G = null;
}
~~~

我们发现，`ReactSharedInternals`为空的，它是在什么时候被设置的呢？实际上在`beginWork`中有一个分支`FunctionComponent`（在前文中，我们对代码进行修剪，只看了关于`HostComponent`的分支），而设置`ReactSharedInternals`的逻辑就是在这：

~~~ts
function beginWork(){
  switch (workInProgress.tag) {
    case FunctionComponent: {
    	const Component = workInProgress.type;
    	return updateFunctionComponent(
    	  current,
    	  workInProgress,
    	  Component,
    	  workInProgress.pendingProps,
    	  renderLanes,
    	);
    }
  }
}

function updateFunctionComponent(
  current: null | Fiber,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  // ...
  
  nextChildren = renderWithHooks(
      current,
      workInProgress,
      Component,
      nextProps,
      context,
      renderLanes,
    );
    hasId = checkDidRenderIdHook();

  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
    // ...
    ReactSharedInternals.H =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
}
~~~

到这里，我们就可以看到`ReactSharedInternals.H`被设置了值：

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

可以看到，这里大部分Hooks都被实现了，具体的代码解析可以阅读[react常见hooks的实现原理](https://www.unstoppable840.cn/article/b567273d-a71b-442e-bc19-d164da7b5a2e)，这里就不再进行代码解析了。其更新调用链路如下：

![](.\images\Snipaste_2025-07-22_13-18-16.jpg)

简单来讲，`useState`的实现里，将`setCount`设置为了更新组件的入口。

### 参考文献

[React源码](https://github.com/facebook/react/)
