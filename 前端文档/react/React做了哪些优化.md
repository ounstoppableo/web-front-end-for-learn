### 导读

本篇文章是属于[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)合集的一个章节，[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)帮助读者剖析react源码，从fiber节点、lane调度优先级控制、微任务调度、虚拟dom更新机制、常见hooks源码解析等，帮助读者理解react设计架构与优化机制，让react的进阶不再困难，让前端能力的提升没有瓶颈。

### React做了哪些优化

在[React源码阅读](https://www.unstoppable840.cn/article/9a58dd4f-0717-40f6-ac93-a28ffea1ea90)的前几个章节中，我们深入的剖析了`React`的运行逻辑，十分的复杂且庞大，那么`React`做的这些究竟带来了哪些优化呢？

- **更新调度层优化（避免卡顿）**

  - 优先级调度（Scheduler + Lane 模型）

    可阅读[React调度工作流](https://www.unstoppable840.cn/article/7794b91d-606a-4ec0-847e-b871098ecc97)

    >引入 React Fiber 架构
    >
    >每个更新会被打上一个 **Lane（优先级）**
    >
    >高优先级（如用户输入）会打断低优更新，实现**响应式 UI**

  - 时间切片 (Time Slicing)

    可阅读[React调度工作流](https://www.unstoppable840.cn/article/7794b91d-606a-4ec0-847e-b871098ecc97)和[React虚拟DOM更新解析](https://www.unstoppable840.cn/article/00871eb1-d110-42c7-a67d-4e0f7c1d34e3)

    > 把更新拆分为小块，允许浏览器在中间插入绘制、输入响应等操作
    >
    > 避免 "长任务阻塞主线程"

- **DOM 层优化（避免不必要的 DOM 操作）**

  - Reconciliation（Diff 算法）

    可阅读[React虚拟DOM更新解析](https://www.unstoppable840.cn/article/00871eb1-d110-42c7-a67d-4e0f7c1d34e3)

    > 基于 Key 和类型比较，精准找到变化的子树
    >
    > 尽量复用节点，避免卸载再挂载

- **Concurrent Rendering（并发渲染）**

  - concurrent mode

    可阅读[React虚拟DOM更新解析](https://www.unstoppable840.cn/article/00871eb1-d110-42c7-a67d-4e0f7c1d34e3)

    > 支持任务中断与恢复
    >
    > 支持多个渲染同时在后台进行，前台优先响应用户交互

- **内部数据结构优化**

  - Fiber 双缓存结构（alternate tree）

    可阅读[React虚拟DOM更新解析](https://www.unstoppable840.cn/article/00871eb1-d110-42c7-a67d-4e0f7c1d34e3)和[React常见hooks的实现原理](https://www.unstoppable840.cn/article/b567273d-a71b-442e-bc19-d164da7b5a2e)

    > 当前树 + workInProgress 树交替使用，避免频繁重建对象

  - Effect 环形链表

    可阅读[React常见hooks的实现原理](https://www.unstoppable840.cn/article/b567273d-a71b-442e-bc19-d164da7b5a2e)

    > 存储副作用而非数组，避免频繁遍历整个 Hook 链

  - updateQueue 巧妙构造（共享 vs 队列）

    可阅读[React常见hooks的实现原理](https://www.unstoppable840.cn/article/b567273d-a71b-442e-bc19-d164da7b5a2e)

    > 让多个更新合并或并发处理时性能更好

### 参考文献

[React源码](https://github.com/facebook/react/)