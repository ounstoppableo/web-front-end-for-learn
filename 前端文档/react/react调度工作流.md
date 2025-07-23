### 导读

本篇文章是属于[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)合集的一个章节，[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)帮助读者剖析react源码，从fiber节点、lane调度优先级控制、微任务调度、虚拟dom更新机制、常见hooks源码解析等，帮助读者理解react设计架构与优化机制，让react的进阶不再困难，让前端能力的提升没有瓶颈。

### React调度工作流

#### 微任务调度逻辑

下面我们来介绍一下react使用的微任务调度算法，其体现在`unstable_scheduleCallback`函数中，下面是该函数的源码：

~~~ts
function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {delay: number},
): Task {
      
  // 设置开始时间
  var currentTime = getCurrentTime();
  var startTime;
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  // 根据优先级设置持续时间
  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      // Times out immediately
      timeout = -1;
      break;
    case UserBlockingPriority:
      // Eventually times out
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      // Never times out
      timeout = maxSigned31BitInt;
      break;
    case LowPriority:
      // Eventually times out
      timeout = lowPriorityTimeout;
      break;
    case NormalPriority:
    default:
      // Eventually times out
      timeout = normalPriorityTimeout;
      break;
  }
  // 计算出最终结束时间
  var expirationTime = startTime + timeout;

  // 创建一个微任务
  var newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  if (enableProfiling) {
    newTask.isQueued = false;
  }
      
  // 根据计算的时间进行调度
  if (startTime > currentTime) {
    // 延迟任务分支
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // All tasks are delayed, and this is the task with the earliest delay.
      if (isHostTimeoutScheduled) {
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // 立刻调度任务
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
  
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback();
    }
  }

  return newTask;
}
~~~

我们来简单讲解一下上面的代码，其中`taskQueue`是常规调度任务队列（以**堆**形式存储），而`timerQueue`是延迟调度队列（以**堆**形式存储），其调度逻辑如下：

- 根据延迟参数确定`startTime`（调度开始时间），利用**微时间**`(timeout)`区分优先级
- 延迟任务加入延迟队列
  - 如果此时普通队列为空，并且新加入的延迟任务为堆顶，则直接设置个定时器去执行。
- 普通任务加入普通队列
  - 以**调度时间**+**微时间**的形式确定调度优先级`（newTask.sortIndex = expirationTime）`，其选择方式在react堆函数的pop中，下面会进行介绍
  - 开始迭代推出堆顶执行，如果现阶段已有任务在执行，则直至需要等待迭代`（isHostCallbackScheduled || isPerformingWork）`，如果没有，则需要启动执行器`（requestHostCallback）`

下面是关于**微时间**的定义：

~~~ts
const userBlockingPriorityTimeout = 250;
const normalPriorityTimeout = 5000;
const lowPriorityTimeout = 10000;
// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;
~~~

简单来说，react使用`setTimeout`来控制任务调度的优先级，而这些优先级本来由明确的优先级定义`（ImmediatePriority...）`转换为`setTimeout`的延迟时间。之后我们会剖析react是如何利用`setTimeout`的，在此之前我们先看一下其如何根据**调度时间**+**微时间**来确定**普通队列**的调度优先级**（堆的顺序）**。

下面是关于react封装的堆函数：

~~~ts
export function push<T: Node>(heap: Heap<T>, node: T): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

export function peek<T: Node>(heap: Heap<T>): T | null {
  return heap.length === 0 ? null : heap[0];
}

export function pop<T: Node>(heap: Heap<T>): T | null {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  const last = heap.pop();
  if (last !== first) {
    // $FlowFixMe[incompatible-type]
    heap[0] = last;
    // $FlowFixMe[incompatible-call]
    siftDown(heap, last, 0);
  }
  return first;
}

function siftUp<T: Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // The parent is larger. Swap positions.
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // The parent is smaller. Exit.
      return;
    }
  }
}

function siftDown<T: Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // If the left or right node is smaller, swap with the smaller of those.
    if (compare(left, node) < 0) {
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // Neither child is smaller. Exit.
      return;
    }
  }
}

function compare(a: Node, b: Node) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
~~~

react使用push将一个任务推入某个堆，那么我们可以猜测react通过pop将某个任务弹出堆并执行，而实际上react也确实如此使用，并且利用pop来进行优先级排序，具体怎么操作的，我们将上面代码分解为一下步骤：

- 进入pop调用，拿到堆顶任务执行
- pop调用siftDown排序现有堆
- siftDown用小堆顶算法根据sortIndex**(调度时间+微时间)**排序好现有堆的顺序，堆顶为sortIndex最小值

总而言之，我们能通过pop拿到sortIndex最小的任务，符合了优先级管理想要的结果。

现在我们来看看这个调度器是如何启动运行的，我们在`unstable_scheduleCallback`的解析中有提到，延迟任务有通过直接设置计时器执行，而普通任务则是通过`requestHostCallback`来执行的，我们来看看`requestHostCallback`的代码：

~~~ts
function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

let schedulePerformWorkUntilDeadline;
// immediate的特性是将任务转换为微任务，执行优先级比MessageChannel高
if (typeof localSetImmediate === 'function') {
  schedulePerformWorkUntilDeadline = () => {
    localSetImmediate(performWorkUntilDeadline);
  };
// 也是利用微任务特性，执行优先级比setImmediate低，比setTimeout高
} else if (typeof MessageChannel !== 'undefined') {
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);
  };
// setTimeout，执行优先级最低
} else {
  schedulePerformWorkUntilDeadline = () => {
    localSetTimeout(performWorkUntilDeadline, 0);
  };
}
~~~

`schedulePerformWorkUntilDeadline`是用于将任务转换成微任务，react从`setImmidate`、`messageChannel`、`setTimeout(fn,0)`三种方法中选一种来使用。

`performWorkUntilDeadline`函数的代码如下：

~~~ts
const performWorkUntilDeadline = () => {
  // 在requestHostCallback中设置为true了
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();
    startTime = currentTime;
    let hasMoreWork = true;
    try {
      // 执行任务
      hasMoreWork = flushWork(currentTime);
    } finally {
      // 执行完后，链式调用后面的任务
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
      }
    }
  }
};
~~~

从这里的代码我们就可以指导react的微任务堆调用逻辑了，其为一种链式调用逻辑，前一个任务执行完后，会判断堆中是否还有任务，如果有就继续调用，如果没有就休眠，直到下次新的任务加入才再启动这个链式调用。不只是**普通队列**如此，**延时队列**也是链式调用，只是在调用时套了一层计时器，这个在后面会简单展示一下其逻辑，下面我们来看看`flushWork`的具体逻辑：

~~~ts
function flushWork(initialTime: number) {
  return workLoop(initialTime);
}
function workLoop(initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
    
  while (currentTask !== null) {
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
        
      // 判断任务是否已经超过计算的最终执行时间
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      // 调用回调
      // 这里并没有因为现在的时间没达到超时时间就不执行回调，而是不管怎么样都会执行，只是会把这个结果下发到回调中
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      
      // 链式回调
      // 如果回调的返回值为函数，那么将其作为原来任务的回调
      // 这里和FiberRoot里的callbackNode相关联
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      // 执行完之后，移除执行过的任务，pop已经在前文介绍过了，不只有移除功能
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
    
  // 查看普通队列中是否还有任务，有的话就返回true给performWorkUntilDeadline做链式任务调用
  if (currentTask !== null) {
    return true;
  
  // 无普通任务的话，执行延时队列链式调用
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}
~~~

workloop已经将普通队列和延时队列的链式调用逻辑都已经介绍完毕了，虽然我没有列出`requestHostTimeout`的内部逻辑，但是可以参考`requestHostCallback`加上了延时参数，这里就不过多赘述了。

到目前为止我们已经完整的过了一遍react的微任务调度逻辑，下面是其过程的流程图：

![](.\images\无标题-2025-07-15-1529.png)



#### lanes优先级算法

##### 基本介绍

lanes是react内部用于管理调度优先级的算法，其本质是一个**31位的位图(bitmask)**，每一位代表一个不同的优先级通道(lane)。我们简单看看react内部所定义的lane:

```ts
export const TotalLanes = 31;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncHydrationLane: Lane = /*               */ 0b0000000000000000000000000000001;
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000010;
// ...
```

看到这里读者可能会有疑惑，这么一会lanes一会lane的，这两者有什么区别？

区别为：lane表示的是一个通道，而lanes则表示多个通道，举个例子：

```ts
const lane =  0b0000000000000000000000000000010;
const lanes = 0b0000000000000000000000000000011;
```

体现在二进制上就是lane只有一个1，lanes可以有多个1。

如果我们希望合并多个通道，一般用`|`，比如：

~~~ts
const lane1 =  0b0000000000000000000000000000010;
const lane2 =  0b0000000000000000000000000000001;
const lanes = lane1 | lane2; // 按位或
~~~

##### 用法介绍

我们在上一节学过react中的微任务调度，发现其`unstable_scheduleCallback`接受的一个参数为`priorityLevel`，其值为数字，类型代码如下：

~~~ts
export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

// TODO: Use symbols?
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;
~~~

也就是说，`unstable_scheduleCallback`既然作为react的唯一微任务调度方法，那么其优先级的模式就应该是最终的优先级模式，`priorityLevel`既然作为0-5的数字，肯定在某个地方，lanes也将被转换成0-5的形式，而这个转换的逻辑如下：

~~~ts
export function lanesToEventPriority(lanes: Lanes): EventPriority {
  // 用于获取最高位的lane
  // 比如getHighestPriorityLane(0b0001000000000000000100010000001)结果为0b0000000000000000000000000000001
  // 最右侧为优先级最高的lane
  // 计算方式 lanes & -lanes(补码)
  const lane = getHighestPriorityLane(lanes);
  
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}
~~~

上面的函数将lanes转换成了lane，简单的来说呢，就是将细化的细粒度优先级合并成泛化的粗粒度优先级，这样才能和0-5的数字匹配，具体粗粒度优先级值如下：

```ts
const DiscreteEventPriority = 0b0000000000000000000000000000010;
const ContinuousEventPriority = 0b0000000000000000000000000001000;
const DefaultEventPriority = 0b0000000000000000000000000100000;
const IdleEventPriority = 0b0010000000000000000000000000000;
```

> **闲话**
>
> 对react来说，应该是希望拥有更细粒度的优先级调度的，但是奈何，更细粒度的优先级调度或许收入(设计开发成本)和支出(性能优化效果)不成正比，所以才选用了这种粗粒度的优先级调度方式，从设计层面来说，既然react使用了lane或许未来也会往细粒度的优先级调度发展。

然后就是将这些粗粒度的优先级转换成0-5数字的优先级：

~~~ts
 switch (lanesToEventPriority(nextLanes)) {
  case DiscreteEventPriority:
  case ContinuousEventPriority:
    schedulerPriorityLevel = UserBlockingSchedulerPriority; // 2
    break;
  case DefaultEventPriority:
    schedulerPriorityLevel = NormalSchedulerPriority; // 3
    break;
  case IdleEventPriority:
    schedulerPriorityLevel = IdleSchedulerPriority; // 5
    break;
  default:
    schedulerPriorityLevel = NormalSchedulerPriority; // 2
    break;
}
~~~

至此，lanes的优先级算法就介绍完毕了。

### 参考文献

[react源码](https://github.com/facebook/react)
