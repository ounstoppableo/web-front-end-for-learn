### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### CSS值处理（Value Processing）

#### css值处理流程

一旦User Agent（浏览器）解析了dom文档并构建了dom树，它必须为平面树中的每个元素以及格式结构中的每个框分配一个值，以应用于目标媒体类型的每个属性，也就是**构建计算样式（computedStyle）**。

所谓计算样式就是最终在浏览器上显示的样式，比如我们定义某个元素宽为`width: 100px`，它最终在页面上的宽不一定是100px，可能是100.5px、可能是101px（当然这个例子可能不太恰当，但是可以说明问题），而这个最终结果就是计算样式，它是通过一系列计算得出来的，其实**级联（优先级）计算**只是其中的一步。现在我们来看看其计算步骤：

- 首先，对于每个元素上的每个属性，收集应用于元素的所有**声明列表**（[declared values](https://drafts.csswg.org/css-cascade-4/#declared-value)）。可能有零个或多个**声明列表**（[declared values](https://drafts.csswg.org/css-cascade-4/#declared-value)）应用于该元素。
- Cascading 生成**级联值**（[cascaded value](https://drafts.csswg.org/css-cascade-4/#cascaded-value)）。每个元素的每个属性最多有一个**级联值**（[cascaded value](https://drafts.csswg.org/css-cascade-4/#cascaded-value)）。
- **默认操作**（Defaulting）将产生**指定值**（[specified value](https://drafts.csswg.org/css-cascade-4/#specified-value)）。每个元素的每个属性都只有一个**指定值**（[specified value](https://drafts.csswg.org/css-cascade-4/#specified-value)）。
- 解析值依赖关系会生成**计算值**（[computed value](https://drafts.csswg.org/css-cascade-4/#computed-value)）。每个元素的每个属性只有一个**计算值**（[computed value](https://drafts.csswg.org/css-cascade-4/#computed-value)）。
- 格式化文档将生成**使用值**（[used value](https://drafts.csswg.org/css-cascade-4/#used-value)）。如果该属性适用于给定属性，则元素仅具有该属性的已用值。
- 最后，根据显示环境的约束将已使用的值转换为**实际值**（[actual value](https://drafts.csswg.org/css-cascade-4/#actual-value)）。与**使用值**（[used value](https://drafts.csswg.org/css-cascade-4/#used-value)）一样，元素上的给定属性可能有也可能没有**实际值**（[actual value](https://drafts.csswg.org/css-cascade-4/#actual-value)）。

其中粗体文字分别都代表一个处理过程：

- **声明列表**（[declared values](https://drafts.csswg.org/css-cascade-4/#declared-value)）

  应用于元素的每个属性声明都会为与该元素关联的属性提供一个声明值，为了找到声明的值，浏览器实现必须首先标识适用于每个元素的所有声明，对于每个元素上的每个属性，形成一个声明值的列表。

  简单来说就是：**我们对元素的声明都会存入元素声明列表中**，举个例子：

  ~~~css
  p {
  	color: red;
  }
  div p {
  	color: blue;
  }
  .test p {
  	color: black;
  }
  
  /* 这些声明都将存入p的声明列表 */
  ~~~

- **级联值**（[cascaded value](https://drafts.csswg.org/css-cascade-4/#cascaded-value)）

  筛选出**声明列表**中唯一生效的值作为级联值。

- **指定值**（[specified value](https://drafts.csswg.org/css-cascade-4/#specified-value)）

  指定的值是样式表作者为该元素准备的给定属性的值。它是将级联值通过默认进程的结果，保证每个元素上的每个属性都存在指定的值。

  **在许多情况下，指定的值是级联值。但是，如果根本没有级联值，则指定的值为默认值，也就是经历默认操作（defaulting）**。

  当 CSS 范围的关键字（initial、inherit、unset）是属性的级联值时，会专门处理它们，并根据该关键字的要求设置指定的值，这也是默认操作（defaulting）的流程。

- **计算值**（[computed value](https://drafts.csswg.org/css-cascade-4/#computed-value)）

  实际上就是将**指定值**中的一些相对属性绝对化：

  - 具有相对单位 （ em， ex， vh， vw） 的值必须通过与适当的参考大小相乘来成为绝对值
  - 某些关键词（例如，smaller, bolder）必须根据其定义进行替换
  - 某些属性的百分比必须乘以参考值（由属性定义）
  - 相对URL解析成绝对URL

- **使用值**（[used value](https://drafts.csswg.org/css-cascade-4/#used-value)）

  used 值是获取**计算值**并完成任何剩余计算的结果，以使其成为文档格式中使用的绝对理论值。简单来讲就是**消除元素上不该有的属性**。比如：

  - flex 属性在非 flex 项的元素上没有**使用值**。

- **实际值**（[actual value](https://drafts.csswg.org/css-cascade-4/#actual-value)）

  原则上，**使用值**是可供使用的，但用户代理可能无法在给定环境中使用该值。例如，用户代理可能只能渲染具有整数像素宽度的边框，因此可能必须近似使用的宽度。此外，元素的字体大小可能需要根据字体的可用性或 font-size-adjust 属性的值进行调整。实际值是进行任何此类调整后的已用值。

#### 默认操作（defaulting）

前面讲述了css值处理流程，其中比较被开发人员关心的就是**级联值**和**指定值**，**级联值**计算流程可以参考我的前一篇文章[CSS广义优先级——级联](https://www.unstoppable840.cn/article/926c2e70-0e2f-4f4c-82c4-bb59f8114f86)，而下面主要是针对**指定值**的生成，其生成过程主要是**默认操作**（defaulting）过程，默认操作有以下3个基本内容：

- 初始值（initial value）
- 继承（inheritance）
- 显示默认（Explicit Defaulting）

##### 初始值（initial value）

每个属性都有一个初始值，该值在属性的定义表中定义。如果该属性不是继承的属性，并且级联不产生值，则该属性的指定值是其初始值。实际上就是user agent（浏览器）默认给定的值。

具体是否是继承属性可查看[Appendix F. Full property table](https://www.w3.org/TR/CSS21/propidx.html)。

**这里的初始化是隐式初始化，其优先级遵从CSS值处理流程，只有在级联没生效时才生效**。

##### 继承（inheritance）

继承将属性值从父元素传播到其子元素。元素上属性的继承值是元素的父元素上属性的**计算值**。对于没有父元素的根元素，继承的值是属性的**初始值**。

具体是否是继承属性可查看[Appendix F. Full property table](https://www.w3.org/TR/CSS21/propidx.html)。

**这里的继承是隐式继承，其优先级遵从CSS值处理流程，只有在级联没生效时才生效**。

##### 显示默认（Explicit Defaulting）

也就是为属性设置CSS 范围关键字的（initial、inherit、unset、revert）。

intial和inherit都知道了，就不说了。

unset的效果是：设置unset的属性，如果它是继承的属性，则将其视为 inherit，如果不是，则将其视为 initial。此关键字有效地擦除了级联中较早出现的所有声明值，正确继承或不适合属性。

**这里的优先级将遵循级联规则优先级**。比如：

~~~css
p {
	background: red;
}
p {
	background: inherit;
}
/* 此时inherit生效 */
~~~

###### revert关键字

revert关键字将级联回滚到较早源的级联值。

如果属性的级联值是 revert 关键字，则行为取决于声明所属的级联原点：

- 用户代理源（user-agent origin）

  等效于 unset。

- 用户源（user origin）

  将级联值回滚到用户代理级别，以便计算指定的值，就好像没有为此元素上的此属性指定作者来源或用户来源规则一样。

- 作者源（author origin）

  将级联值回滚到用户级别，以便计算指定的值，就像没有为此元素上的此属性指定作者来源规则一样。为了进行还原，此源包括 Animation 源。

> 爱思考的读者可能会认为如果遇到!important的情况会出现冲突，实际上仔细思考一下[CSS广义优先级——级联](https://www.unstoppable840.cn/article/926c2e70-0e2f-4f4c-82c4-bb59f8114f86)中关于源优先级比较的情况就会发现不存在冲突，因为用户代理源的!important>用户源!important>作者源!important。

### 参考文献

[*CSS current work*& how to participate](https://www.w3.org/Style/CSS/current-work)

[CSS Snapshot 2023](https://www.w3.org/TR/css-2023/)

[CSS Cascading and Inheritance Level 4](https://drafts.csswg.org/css-cascade-4/#cascade-sort)

[Appendix F. Full property table](https://www.w3.org/TR/CSS21/propidx.html)