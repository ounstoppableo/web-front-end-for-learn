### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### W3C介绍

W3C（The World Wide Web Consortium），中文名为万维网联盟，是制定web服务相关标准的头部组织。为了解决网络应用中不同平台、技术和开发者带来的不兼容问题，保障网络信息流通得顺利完整，W3C制定了一系列标准并监督网络应用开发者和内容提供者遵循这些标准。其制定的标准包括以下内容：

- [W3C推荐标准](https://zh.wikipedia.org/wiki/W3C推荐标准)
- [CSS](https://zh.wikipedia.org/wiki/CSS)：层叠样式表
- [DOM](https://zh.wikipedia.org/wiki/DOM)：文档对象模型
- [HTML](https://zh.wikipedia.org/wiki/HTML)：超文本标记语言
- [RDF](https://zh.wikipedia.org/wiki/資源描述框架)：资源描述框架
- [SMIL](https://zh.wikipedia.org/wiki/SMIL)：同步多媒体集成语言
- [SVG](https://zh.wikipedia.org/wiki/SVG)：可缩放矢量图形
- [WAI](https://zh.wikipedia.org/w/index.php?title=WAI&action=edit&redlink=1)
- [Widgets](https://zh.wikipedia.org/w/index.php?title=Widgets&action=edit&redlink=1)
- [XHTML](https://zh.wikipedia.org/wiki/XHTML)：可扩展超文本标记语言
- [XML](https://zh.wikipedia.org/wiki/XML)：可扩展标记语言
- [PICS](https://zh.wikipedia.org/w/index.php?title=PICS&action=edit&redlink=1)：网络内容筛选平台

[w3c标准阅读网站](https://www.w3.org/)

### W3C标准阅读方式

#### 找到标准位置

![](.\image\Snipaste_2024-09-24_14-30-26.jpg)

这是w3c标准的入口，所有的w3c标准都会在这里呈现。

![](.\image\Snipaste_2024-09-24_14-31-50.jpg)

这里我们就可以筛选出css相关的标准。

#### 技术报告类型

技术报告实际上就是w3c标准生成的前世今生，w3c在生成前会经历各种生命周期，而所经历的每个生命周期的草案，都是技术报告。

技术报告有以下三个类型：

- **Recommendations**：工作组在W3C推荐跟踪(Recommendation Track)上编写技术报告，以产生作为Web标准的规范规范或指导方针。**也就是未来可能会成为w3c标准的技术报告。**
- **Notes**：小组还可以将文档发布为W3C Notes和W3C Statements，通常用于记录技术规范以外的信息，例如激发规范的用例和使用规范的最佳实践。**一般不会成为w3c标准，可以作为w3c标准的灵感。**
- **Registries**：工作组还可以发布注册表，以记录值集合或其他数据。这些通常在单独的注册中心报告中发布，尽管它们也可以作为注册中心部分直接嵌入到Recommendation Track文档中。**主要是为拓展服务。**

#### 技术报告状态

##### 推荐跟踪（Recommendation Track）

- First Public Working Draft（**FPWD**）：这是发布给公众的第一个草案版本，目的是让社区和公众对规范提出意见。这时的规范内容可能还不完整，后续会有较多的修改。
- Working Drafts（**WD**）：这是一系列逐步完善的草案版本，随着社区反馈的融入，规范会逐步更新和改进。工作草案可能会发布多个版本。
- Candidate Recommendations（**CR**）：这个阶段表示规范已经成熟，开发人员可以开始使用或实现该技术。规范需要在实际环境中测试并确保满足可实施性和兼容性。W3C 会收集实现报告以确认技术的可行性。
  - Candidate Recommendation Snapshot （**CRS**）：它代表了规范在某个特定时间点的稳定状态，并在此基础上进行广泛测试。这个版本的主要目标是获得反馈，评估其可行性和兼容性。
  - Candidate Recommendation Draft （**CRD**）：CRD 是在候选推荐阶段的“动态”版本，表示该规范仍在持续修改和优化中。
- Proposed Recommendation（**PR**）：当候选推荐阶段的测试反馈得到满足，规范会进入提议推荐阶段。此时，W3C 的技术委员会会审查反馈并决定是否正式将其作为 W3C 推荐标准。
- W3C Recommendation（**REC**）：一旦提议推荐被批准，规范会成为 W3C 推荐标准。此时，它被视为稳定并鼓励广泛采用。W3C 推荐意味着经过了广泛的审查和测试，适用于生产环境。

![](.\image\Snipaste_2024-09-24_15-12-56.jpg)

##### 弃用过程（Abandoning a W3C Recommendation）

其中AC是Advisory Committee（咨询委员会）

![](.\image\Snipaste_2024-09-24_15-29-24.jpg)

##### NOTE跟踪（The Note Track）

-  Group Note （**NOTE**） ：note发布的目的是为有用的文档提供稳定的参考，而不是打算成为正式的标准。

##### 典型技术报告推荐跟踪实例：

![](.\image\Snipaste_2024-09-24_15-47-02.jpg)

#### 技术报告状态与标准状态的对应

![](.\image\Snipaste_2024-09-24_15-54-12.jpg)

看上图，这是一个标准的描述信息，我们发现它利用`Candidate Standard`来标识该标准的状态，那么它相当于技术报告状态中的哪个呢？我们看下图：

![](.\image\Snipaste_2024-09-24_15-53-00.jpg)

可以发现`Standards`、`Supporting Notes`、`Supporting Registries`分别对应技术报告的三个类型，所以实际上`Standards`的状态就是`Recommendation Track`的状态。简单对应起来就是：

| Recommendation Track                   | Standards           |
| -------------------------------------- | ------------------- |
| First Public Working Draft（**FPWD**） | Draft Standards     |
| Working Drafts（**WD**）               |                     |
| Candidate Recommendations（**CR**）    | Candidate Standards |
| Proposed Recommendation（**PR**）      |                     |
| W3C Recommendation（**REC**）          | Standards           |

#### 标准描述下的属性所代表的意思

![](.\image\Snipaste_2024-09-24_15-54-12.jpg)

一个常规的标准描述如上图所示，我们解释过`Candidate Standard`的含义了，下面`CSS Grid Layout Module Level 2`是标准名称，有日期、标签、递交者（定义标准的组织）这些都没什么好说的，最后一个`Latest Candidate Recommendation Snapshot`就需要提一下，它是技术报告CR流程下的CRS，也就是稳定测试版。

### 参考文献

[W3C Process Document](https://www.w3.org/policies/process/#cr-1)
