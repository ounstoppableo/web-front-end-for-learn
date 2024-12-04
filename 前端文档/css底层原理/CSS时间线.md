### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### 介绍

本篇文章是一篇动态文章，会实时更近CSS的最新动态~~

### CSS年度更新导视

#### 二零二四

- [CSS View Transitions Level 2 ](https://www.w3.org/TR/css-view-transitions-2/)`FPWD` `2024.11.13`

  视图过渡（如 [css-view-transitions-1](https://www.w3.org/TR/css-view-transitions-2/#biblio-css-view-transitions-1) 中所指定）是一项功能，它允许开发人员在文档的视觉状态之间创建动画过渡。

  `Level 2`扩展了该规范，添加了必要的 API 和生命周期，以便在同源跨文档导航中启用过渡，并添加了一些功能，以便更轻松地创作具有更丰富视图过渡的页面。

  `Level 2`定义以下内容：

  - 跨文档视图过渡，包括`@view`过渡规则和启用跨文档视图过渡生命周期的算法。
  - 选择性视图过渡，一种基于活动视图过渡的存在来匹配样式的方法，更具体地说，是基于活动视图过渡是某种类型的。
  - 在视图过渡伪元素之间共享样式，一种声明一次样式并将其用于多个视图过渡伪元素的方法。这包括`view-transition-class`属性，以及对命名伪元素的添加

- [CSS Values and Units Level 5](https://www.w3.org/TR/css-values-5/) `WD ` `2024.11.11`

  这是针对 [CSS Values and Units Level 4](https://www.w3.org/TR/css-values-4/)的差异规范。

- [CSS Conditional Rules Level 5](https://www.w3.org/TR/css-conditional-5) `WD` `2024.11.5`

  `CSS Conditional Level 5`扩展了`@supports`规则并支持查询语法，以允许测试支持的字体技术。

  它还添加了一个`@when`规则，该规则概括了条件规则的概念。任何可以在现有条件规则中表示的东西都可以用`@when`表示，方法是将其包装在适当的函数中以声明它是什么类型的条件。这使作者可以轻松地将多种类型的查询（如媒体查询和支持查询）组合到单个布尔表达式中。没有这个，作者必须依赖嵌套单独的条件规则，这更难读写，前提是条件与 “and” 布尔关系连接（没有简单的方法来表示其他任何内容），并限制了它们在提议的条件规则链中的效用。

  它还添加了`@else`规则，这些规则紧跟在其他条件规则之后，并自动将其条件限定为前一个规则条件的反转，以便仅应用条件规则链中的第一个匹配规则。

  它还添加了`Container Queries`。它们在概念上类似于`Media Queries`，但允许测试文档中元素的各个方面（例如框尺寸或计算样式），而不是整个文档。

- [CSS Anchor Positioning](https://www.w3.org/TR/css-anchor-position-1/) `WD` `2024.10.4`

  CSS 绝对定位允许作者将框放置在页面的任何位置，而不考虑除其包含块之外的其他框的布局。这种灵活性可能非常有用，但也非常有限 - 通常您希望相对于其他框进行定位。锚点定位（通过`position-anchor` 和`position-area`属性和/或锚点函数`anchor()`和`anchor-size()`）允许作者实现此目的，将绝对定位的框“锚定”到页面上的一个或多个其他框，同时还允许他们尝试多个可能的位置，以找到避免重叠/溢出的“最佳”位置。

- [CSS Grid Layout Level 3](https://www.w3.org/TR/css-grid-3/) `FPWD` `2024.10.3`

  网格布局是 CSS 的布局模型，具有控制框及其内容的大小和定位的强大功能。网格布局针对 2 维布局进行了优化：在二维布局中，需要在两个维度上对齐内容。

  尽管许多布局可以用常规`Grid Layout`来表示，但在两个轴上都将项限制在一个 Grid 中也会导致无法在 Web 上表示一些常见的布局。

  该模块定义了一个布局系统，该系统消除了该限制，以便项目可以放置在其中一个轴的类似 Grid 的轨道中，同时将它们一个接一个地堆叠在另一个轴上。根据到目前为止放置的项目的布局大小，将项目配置到剩余空间最大的列（或行）中。本模块还通过这个新的网格项放置策略扩展了 CSS 网格，并通过新的对齐功能扩展了 CSS 框对齐。

- [CSS Cascading and Inheritance Level 6 ](https://www.w3.org/TR/css-cascade-6)`WD` `2024.9.6`

  这是[CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/)的差异规范。它目前只是一个探索性工作草案。

- [CSS Easing Functions Level 2 ](https://www.w3.org/TR/css-easing-2/)`FPWD` `2024.8.29`

  通常需要控制某些值变化的速率。例如，逐渐增加元素移动的速度可以使元素产生一种重量感，因为它似乎在聚集动量。这可用于生成直观的用户界面元素或令人信服的卡通道具，其行为与物理道具类似。或者，有时希望动画以不同的步骤向前移动，例如旋转分段的轮子，以便段始终显示在相同的位置。

  同样，控制渐变插值的变化率可用于产生不同的视觉效果，例如暗示凹面或凸面，或产生条纹效果。

  缓动函数提供了一种通过获取输入进度值并生成相应的转换后的输出进度值来转换此类值的方法。

- [CSS Inline Layout Level 3](https://www.w3.org/TR/css-inline-3/) `WD` `2024.8.12`

  该草案定义了行内布局，用于布局文本和行内级框的混合流的 CSS 模型，并定义了每行中此内容的块轴对齐和大小的控件。它还为首字下沉和类似的首字母样式添加了特殊的布局模式。

- [CSS Box Model Level 4 ](https://www.w3.org/TR/css-box-4)`WD` `2024.8.4`

  CSS 描述了如何通过将元素树转换为一组框来布局源文档中的每个元素和每个文本字符串，这些框的大小、位置和画布上的堆叠级别取决于其 CSS 属性的值。

  每个 CSS 框都有一个矩形内容区域、内容周围的填充带、填充周围的边框和边框外的边距。大小调整属性 [css-sizing-3](https://www.w3.org/TR/css-box-4/#biblio-css-sizing-3)以及控制布局的各种其他属性定义内容区域的大小。框样式属性（`padding` 及其` longhands`、`border`及其`longhands`、`margin`及其` longhands`）定义这些其他区域的大小。边距和填充在此模块中定义；边框在[css-backgrounds-3](https://www.w3.org/TR/css-box-4/#biblio-css-backgrounds-3) 中定义。

- [CSS Scroll Snap Level 2 ](https://www.w3.org/TR/css-scroll-snap-2/)`FPWD` `2024.7.23`

  滚动体验并不总是从头开始。与轮播、滑动控件和列表视图的交互通常打算从一些元素开始，这些元素可能未位于滚动容器的开头。需要 JavaScript 才能使滚动容器最初滚动到该元素。通过启用 CSS 来指定元素最初应滚动到，用户、页面作者和浏览器都会受益。

  除了设置初始滚动目标外，开发人员还需要对`Scroll Snap`的见解和事件。事件，例如在哪个轴上对齐哪个元素、对齐事件何时更改、对齐完成时以及以编程方式对齐到子项的便利性。

- [CSS Text Level 4 ](https://www.w3.org/TR/css-text-4/)`WD` `2024.5.29`

  本草案描述了 CSS 的排版控件；即控制将源文本转换为格式化的换行文本的CSS功能。各种 CSS 属性提供对大小写转换、空格折叠、文本换行、换行规则和断词、对齐和对齐、间距和缩进的控制。

- [CSS Properties and Values API Level 1](https://www.w3.org/TR/css-properties-values-api-1/) `WD` `2024.3.26`

  CSS定义了一组全面的属性，可以对其进行操作以修改Web文档的布局、绘制或行为。但是，Web作者经常希望使用其他属性来扩展此集。

  [css-variables](https://www.w3.org/TR/css-properties-values-api-1/#biblio-css-variables) 为定义用户控制的属性提供了原始方法，但是这些属性总是将标记列表作为值，必须始终继承，并且只能通过`var()`引用重新合并到其他属性的值中来影响文档布局或绘制。

  该规范扩展了[css-variables](https://www.w3.org/TR/css-properties-values-api-1/#biblio-css-variables) ，允许通过两种方法注册具有值类型、初始值和定义的继承行为的属性：

  - 一个 JS API，该方法`registerProperty()`
  - CSS at-rule，即 `property`规则

- [CSS Typed OM Level 1](https://www.w3.org/TR/css-typed-om-1/) `WD` `2024.3.21`

  CSS 样式表被解析为抽象的 UA 内部数据结构，即CSS的内部表示，各种规范算法对其进行操作。

  [Internal representations](https://www.w3.org/TR/css-typed-om-1/#css-internal-representation)不能直接操作，因为它们是implementation-dependent；UA 必须就如何解释[Internal representations](https://www.w3.org/TR/css-typed-om-1/#css-internal-representation)达成一致，但表示本身是故意未定义的，以便 UA 可以以对他们最有效的方式存储和操作 CSS。以前，读取或写入[Internal representations](https://www.w3.org/TR/css-typed-om-1/#css-internal-representation)的唯一方法是通过字符串 — 样式表或`CSSOM` 允许作者将字符串发送到 UA，这些字符串被解析为[Internal representations](https://www.w3.org/TR/css-typed-om-1/#css-internal-representation)，而`CSSOM`允许作者请求 UA 将其内部表示序列化回字符串。

  此规范引入了一种与[Internal representations](https://www.w3.org/TR/css-typed-om-1/#css-internal-representation)交互的新方法，方法是使用专用的 JS 对象表示它们，这些对象比字符串解析/连接更容易、更可靠地进行操作和理解。这种新方法对作者来说既更容易（例如，数值反映在实际的 JS 数字中，并且为它们定义了单位感知的数学运算），而且在许多情况下性能更高，因为可以直接操作值，然后廉价地转换回[Internal representations](https://www.w3.org/TR/css-typed-om-1/#css-internal-representation)，而无需构建和解析 CSS 字符串。

- [CSS Color Level 5](https://www.w3.org/TR/css-color-5/) `WD` `2024.2.29`

  Web 开发人员、设计工具和设计系统开发人员经常使用颜色函数来帮助扩展其组件颜色关系的设计。随着支持多个平台和多个用户首选项的设计系统的使用越来越多，例如在 UI 中增加深色模式的功能，这变得更加有用，无需手动设置颜色，而是拥有计算方案的单一来源。

  目前使用`Sass`、`HSL`值上的`calc()`或`PostCSS`来执行此操作。但是，预处理器无法处理动态调整的颜色；所有当前解决方案都仅限于`sRGB`色域和`HSL`的感知限制（颜色在色轮中聚集，两种视觉亮度不同的颜色（如黄色和蓝色）可以具有相同的`HSL`亮度）。

  该模块添加了新函数`color-mix()`和`light-dark()` ，并使用相对颜色语法扩展了现有函数。

  它还扩展了`color()`函数，以便不仅可以在 CSS 中使用预定义的色彩空间，还可以使用由ICC配置文件定义的自定义色彩空间（包括校准的 CMYK）。

  它还添加了`device-cmyk`，这是未校准的cmyk颜色的表示形式。

- [CSS Fonts Level 5](https://www.w3.org/TR/css-fonts-5/) `WD` `2024.2.6`

  [CSS-FONTS-4](https://www.w3.org/TR/css-fonts-5/#biblio-css-fonts-4)规范描述了 CSS 提供的用于在文档中选择和使用字体的控件，包括对可变字体和彩色字体的支持。这里的想法是对[CSS-FONTS-4](https://www.w3.org/TR/css-fonts-5/#biblio-css-fonts-4)中定义的属性和规则的添加或修改。

  此规范目前是[CSS-FONTS-4](https://www.w3.org/TR/css-fonts-5/#biblio-css-fonts-4)规范的增量。

- [CSS Generated Content for Paged Media ](https://www.w3.org/TR/css-gcpm-3/)`WD` `2024.1.25`

  分页媒体对文档内容的显示有许多特殊要求，这些要求在印刷书籍的悠久历史中不断发展。比如：Running 页眉和页脚用作导航辅助工具；注释可能以脚注的形式出现在页面底部；页面本身的属性可能会根据其内容或文档中的位置而更改；交叉引用可能需要生成文本；某些分页媒体格式（如 PDF）使用书签进行导航。

  此草案定义了新的属性和值，以便开发人员可以将这些技术引入分页媒体。

- [CSS Viewport Level 1 ](https://www.w3.org/TR/css-viewport-1/)`WD` `2024.1.25`

  在过去的应用开发中，开发人员一般都是基于较大的视口（比如桌面）进行宽度、大小设置，然后在对较小的视口（比如手机）进行额外的适配，也就是所谓的响应式。但是这样的开发方式仍然存在着诸多问题，简单来说就是不灵活。

  而本篇草案就是致力于解决该问题。

#### 二零二三

- [CSS Transitions Level 2 ](https://www.w3.org/TR/css-transitions-2/)`FPWD` `2023.9.5`

  这是一个增量规范，意味着它当前仅包含与 CSS 过渡级别 1  [CSS-TRANSITIONS-1](https://www.w3.org/TR/css-transitions-2/#biblio-css-transitions-1) 的差异。一旦 1 级规范接近完成，它将与此处的添加内容合并为完整的 2 级规范。

- [Scroll-driven Animations ](https://www.w3.org/TR/scroll-animations-1/)`WD` `2023.6.6`

  该草案定义了基于滚动容器的滚动进度来驱动动画进度的机制。这些滚动驱动的动画使用基于滚动位置的时间线，而不是基于时钟时间的时间线。该模块提供了基于 Web 动画 API 的命令式 API 以及基于 CSS 动画的声明式 API。

  有两种类型的滚动驱动时间线：

  - [滚动进度时间线](https://www.w3.org/TR/scroll-animations-1/#scroll-timelines)，链接到特定滚动容器的滚动进度
  - [查看进度时间线](https://www.w3.org/TR/scroll-animations-1/#view-timelines)，通过滚动端口链接到特定框的查看进度

- [CSS Animations Level 2](https://www.w3.org/TR/css-animations-2/) `WD` `2023.6.2`

  这是一个增量规范，意味着它当前仅包含与 CSS 动画级别1 [CSS3-ANIMATIONS](https://www.w3.org/TR/css-animations-2/#biblio-css3-animations)的差异。一旦 1 级规范接近完成，它将与此处的添加内容合并为完整的 2 级规范。

- [Web Animations Level 2](https://www.w3.org/TR/web-animations-2/) `FPWD` `2023.2.21`

  这是一个增量规范，意味着它当前仅包含与 Web 动画级别 1 [WEB-ANIMATIONS-1](https://www.w3.org/TR/web-animations-2/#biblio-web-animations-1)的差异。一旦 1 级规范接近完成，它将与此处的添加内容合并为完整的 2 级规范。

  与本规范的先前级别相比，本规范引入了以下更改：

  - 群体效应和序列效应
  - 动画效果特定的播放速率
  - 支持非单调（滚动）时间线

- [CSS Nesting](https://www.w3.org/TR/css-nesting-1/) `WD` `2023.2.14`

  该草案描述了对将一个样式规则嵌套在另一个样式规则中的支持，允许内部规则的选择器引用外部规则匹配的元素。此功能允许将相关样式聚合到 CSS 文档中的单个结构中，从而提高可读性和可维护性。

### 参考文献

[CSS Snapshot 2023](https://www.w3.org/TR/CSS/#css)

[*CSS current work*](https://www.w3.org/Style/CSS/current-work)