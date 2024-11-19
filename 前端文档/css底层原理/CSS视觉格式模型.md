### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### 视觉格式模型（Visual formatting model）

视觉格式模型是css里最为核心的概念，其内容也十分丰富、繁杂，这里主要介绍一些比较重要的概念。

视觉格式模型描述的是**页面呈现元素的方式**，它包含以下几个内容：

- **盒子尺寸和类型**。
- **布局（标准流、浮动、定位、flex[css3新增]、grid[css3新增]）**。
- 文档树中元素之间的关系（正常流的排列顺序）。
- 外部信息（例如，视口大小、图像的固有尺寸等）。

下面将会重点介绍**盒子尺寸和类型**和**布局**。

#### 一些概念介绍

##### 替换元素（replaced element）和非替换元素（non-replaced element）

- 替换元素

  其内容超出 CSS 格式模型范围的元素，例如图像或嵌入文档。例如，HTML `img` 元素的内容通常被其 `src` 属性指定的图像替换。被替换的元素通常具有自然维度。例如，位图图像具有以绝对单位指定的自然宽度和自然高度。

- 非替换元素

  非替换元素是未被替换的元素，即其渲染由 CSS 模型决定。

##### 连续媒体和分页媒体

- 连续媒体（[continuous media](https://www.w3.org/TR/CSS21/media.html#continuous-media-group)）

  可滚动界面。

- 分页媒体（[paged media](https://www.w3.org/TR/CSS21/media.html#paged-media-group)）

  内容分页显示，如打印、pdf文档。

##### 包含块

包含块是视觉格式模型中非常重要的概念，几乎所有盒子的**位置、大小**计算都是基于包含块的。下图是[css盒模型](https://www.unstoppable840.cn/article/ddf24396-4826-4981-b3fd-6a0f21fb9fcb)，我将以此图为例介绍包含块。

![](.\image\box.png)

元素框的**位置和大小**有时是相对于某个矩形（称为元素的**包含块**）计算的。**元素的包含块定义**如下：

- **根元素所在的包含块是一个称为初始包含块的矩形**。对于连续媒体，它具有视区的尺寸，并锚定在画布原点处；对于分页媒体的页面区域。初始包含块的 'direction' 属性与根元素的 'direction' 属性相同。

- 对于其他元素，如果元素的位置是` 'relative'` 或` 'static'`，则**包含块由最近的块容器祖先框的`content edge`形成**。

- 如果元素具有` 'position： fixed'`，则包含块由视区（如果是连续媒体）或页面区域（如果是分页媒体）建立，也就是**相对于视口**。

  > **注意**：可能导致盒子建立固定定位包含块的属性包括 `transform`、`will-change`、`contain` 、 `filter` 、`perspective`...

- 如果元素具有 `'position： absolute'`，则包含块由**最近的祖先（其 'position' 为 'absolute'、'relative' 或 'fixed'）建立**，方式如下：

  - 如果祖先是`行内元素`，则包含块是该元素生成的**第一个和最后一个行盒的边界框**。在 CSS 2.1 中，如果内联元素被拆分为多行，则包含块是 undefined。但在CSS3中引入了fragment，细节就不说了。

  - 如果祖先是`块级元素`，**包含块由祖先的`padding edge`形成**，以下是例子：

    ~~~html
     <style>
            .father {
                width: 300px;
                height: 300px;
                background-color: aqua;
                position: relative;
            }
    
            .relative {
                position: relative;
                width: 100px;
                height: 100px;
                background-color: antiquewhite;
                padding: 20px;
            }
    
            .absolute {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                background-color: aquamarine;
            }
    </style>
    <body>
        <div class="father">
            <div class="relative">
                <div class="absolute"></div>
            </div>
        </div>
    </body>
    ~~~

    ![](.\image\Snipaste_2024-10-17_09-06-08.jpg)

    我们可以发现absolute盒子的**宽和高**与relative盒子一致，并且**top偏移**也是基于padding edge的，只不过**初始位置**是相对于`content edge`，因为没设置left时可以看到antiquewhite颜色。

#### 盒子的尺寸和类型

盒子的尺寸已经在我之前的文章[css盒模型](https://www.unstoppable840.cn/article/ddf24396-4826-4981-b3fd-6a0f21fb9fcb)中介绍了，这里就不再重复介绍了，下面主要是介绍盒子的类型。

##### 盒子的类型

- 块级元素（块盒）

  块级元素是document中在视觉上格式化为块（例如段落）的元素。'display' 属性的以下值使元素成为块级： 'block'、'list-item' 和 'table'。

  有一种特殊情况的块盒：**匿名块盒**，其定义如下：

  ~~~html
  <div>
    	Some text
      <P>More text</P>
  </div>
  ~~~

  

  ![](.\image\Snipaste_2024-09-25_16-05-57.jpg)

  假设div和p都有 'display： block'，div似乎同时具有行内内容和块内容。为了更容易定义格式，我们假设 “Some text” 周围有一个匿名块框。

  换句话说：如果一个区块容器盒（例如上面为div生成的那个）内部有一个区块级的盒子（例如上面的 p），那么我们强制它内部只有区块级的盒子。

- 行内元素（行盒）

  行内元素是源文档中不形成新内容块的那些元素；内容按行分布（例如，段落中强调的文本、行内图像等）。'display' 属性的以下值使元素成为行内层元素： 'inline'、'inline-table' 和 'inline-block'。行内元素生成行内级框，这些框是参与行内格式上下文的框。

#### 布局

在css中，一个盒子有五种布局方案（`布局有很多版本，这里列出的是我进行分类的结果`）：

- 标准流（normal flow）：包含块布局、行内布局和表格布局。
- 浮动（Floats）
- 定位（positioning）
- 弹性盒子（flex）
- 网格（grid）

##### 标准流（normal flow）

###### 块级格式化上下文（Block Formatting Contexts,BFC）

BFC指的是包含内部浮动、排除外部浮动和抑制边距折叠的框，简单来说就是，**BFC内部的作用不会影响外部**，其发生情况：

- 元素的 `float` 属性不是 `none`。
- 元素的 `position` 属性是 `absolute` 或 `fixed`。
- 元素的 `display` 属性是 `inline-block`、`table-cell`、`table-caption` 或 `flex` / `inline-flex`。
- 元素的 `overflow` 属性不是 `visible`。

###### 行内格式化上下文（Inline Formatting Contexts,IFC）

在行内格式上下文中，框从包含块的顶部开始，一个接一个地水平布局。这些框之间遵循水平边距、边框和填充。这些框可以以不同的方式垂直对齐（`vertical-align`）：它们的底部或顶部可以对齐，或者其中的文本基线可以对齐。包含形成线条的框的矩形区域称为线条框。

##### 浮动（float）

float 是在当前行上向左或向右移动的框。

##### 定位（position）

position 属性确定使用哪种定位方案来计算框的位置。除 static 以外的值使框成为定位框，并使其为其后代建立**包含块**的绝对定位。

###### static

该框不是定位框，而是根据其父格式上下文的规则进行布局。inset 属性不适用。

###### relative

relative相对于外部的位置与static一样，且inset同样不适用，但是它提供给子盒子一个定位空间（包含块），在其内部的定位盒子将基于relative所在的位置进行偏移。

###### sticky

和relative一样，为子盒子创建包含块。sticky的偏移量会参考最近的祖先滚动容器的滚动端口（由 inset 属性修改）在 inset 属性不是两个 auto 的轴上自动调整，以尝试在用户滚动时将框保持在其包含块内的视图中。这种定位方案称为粘性定位。

###### absolute

该框已从 flow 中取出，因此它对其同级和上级的大小或位置没有影响，并且不参与其父级的格式设置上下文。

###### fixed

与 absolute 相同，但框的位置和大小是相对于包含块的固定位置（通常是连续媒体中的视区，或分页媒体中的页面区域）确定的。框的位置相对于此引用矩形是固定的：当附加到视区时，它会在滚动文档时不会移动，当附加到页面区域时，当文档分页时，它会在每一页上复制。这种定位方案称为固定定位，被认为是绝对定位的子集。

##### 弹性盒子（flex）

flex盒子的**内容**：

- Flex 布局在表面上类似于块布局。

- 可以沿任何流向布置（向左、向右、向下甚至向上）
- 可以在样式图层上反转或重新排列它们的显示顺序（即，视觉顺序可以独立于源和语音顺序）
- 可以沿单个（主轴）轴线性布置，也可以沿次（十字）轴绕成多条线
- 可以“调整”其大小以响应可用空间
- 可以相对于它们的容器对齐，也可以在辅助 （ cross） 上彼此对齐
- 可以沿主轴动态折叠或取消折叠，同时保持容器的交叉大小

flex盒子的**含义**：

Flex 容器是由计算显示为 flex 或 inline-flex 的元素生成的框。Flex 容器的 In-Flow 子项称为 Flex 项，并使用 Flex 布局模型进行布局。

其中存在**主轴**和**侧轴**，flex就是能沿着这两个轴自由变动，如下图：

![](.\image\Snipaste_2024-10-16_17-03-23.jpg)

flex盒子的类别：

- flex：此值会导致元素在放置在流布局中时生成块级的 flex 容器框。
- inline-flex：此值会导致元素在放置在流布局中时生成内联级别的 flex 容器框。

##### 网格（grid）

grid盒子的**内容**：

- 固定、灵活和基于内容的轨道大小调整功能
- 通过向前（正）和向后（负）数字网格坐标、命名网格线和命名网格区域显式放置项目;自动将商品放置到空白区域，包括按顺序重新排序
- 空间敏感的轨道重复和自动添加行或列以适应其他内容
- 使用margin、gutters和 alignment properties控制对齐和间距
- 能够使用 z-index 重叠内容和控制分层

grid盒子的**含义**：

网格容器的内容是通过定位和对齐到网格中来布局的。网格是一组相交的水平和垂直网格线，它将网格容器的空间划分为多个网格区域，网格项（表示网格容器的内容）可以放置在这些区域。有两组网格线：一组定义沿块轴延伸的列，另一组定义沿行轴的行。如下图：

![](.\image\Snipaste_2024-10-16_17-17-56.jpg)

### 参考文献

[*CSS current work*& how to participate](https://www.w3.org/Style/CSS/current-work)

[CSS Snapshot 2023](https://www.w3.org/TR/css-2023/)

[Visual formatting model](https://www.w3.org/TR/CSS21/visuren.html)

[Visual formatting model details](https://www.w3.org/TR/CSS21/visudet.html)

[CSS Display Module Level 3](https://drafts.csswg.org/css-display-3/#non-replaced)

[CSS Positioned Layout Module Level 3](https://www.w3.org/TR/css-position-3/#comparison)