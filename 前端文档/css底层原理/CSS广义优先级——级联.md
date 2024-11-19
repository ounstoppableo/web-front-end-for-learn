### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### 级联（cascading）概念介绍

#### 级联介绍

级联这个词听起来很陌生，但是换成优先级大家就明白了，实际上**级联就表示样式规则生效的优先级和应用顺序**。w3c给出的描述是这样的：**级联采用给定元素上给定属性的声明值的无序列表，按其声明的优先级对它们进行排序，并输出单个级联值。**用人话来说就是css支持对同一个属性进行多次样式规则设置，然后根据**级联的规则**选择最终生效的效果。而这个**级联的规则**就是我们要弄清楚的css的优先级规则。

#### 级联的源（cascading origins）

- css2和css3共有：

  - 作者源（Author Origin）：作者根据文档语言的约定为源文档指定样式表。例如，在 HTML 中，样式表可以包含在文档中或从外部链接。实际上也就是前端开发人员写的样式，分别就是行内、内联、外部样式等。

  - 用户源（User Origin）：用户可能能够指定特定文档的样式信息。比如用户通过浏览器的某些插件设置了一些自定义的样式，比如开启了浏览器的暗黑模式。
  - 用户代理源（User-Agent Origin）：指浏览器默认提供的样式。这些样式在没有其他样式应用时，会自动为网页元素应用。w3c给浏览器规定了一个默认样式的推荐方案[HTML user agent style sheet](https://html.spec.whatwg.org/multipage/rendering.html#the-css-user-agent-style-sheet-and-presentational-hints)，基本上现有浏览器都会按照这个规范去设置默认样式。

- css3新增源：

  - 动画源（Animation Origin）：CSS 动画在运行时生成表示其效果的 “虚拟” 规则。
  - 过渡源（Transition Origin）：与 CSS 动画一样，CSS 过渡会生成“虚拟”规则，表示它们在运行时的效果。

#### !important注释

这个功能是大家都常用的功能，给某个属性添加它感觉这个属性就无敌了，但是事实并非如此，!important也是存在优先级的，具体会在后面**级联排序顺序**的内容介绍。

#### 非CSS表示提示优先级（Precedence of Non-CSS Presentational Hints）

浏览器可以选择遵循 HTML 源文档中的 presentational 属性如果是这样，则这些属性将转换为相应的 CSS 规则，其特异性等于 0，并被视为插入到作者样式表的开头。因此，它们可能会被后续样式表规则覆盖。在过渡阶段，此策略将使样式属性更容易与样式表共存。

> 对于 HTML，任何不在以下列表中的属性都应被视为表示性属性： abbr， accept-charset， accept， accesskey， action， alt， archive， axis， charset， checked， cite， class， classid， code， codebase， codetype， colspan， coords， data， datetime， declare， defer， dir， disabled， enctype， for， headers， href， hreflang， http-equiv， id， ismap， label， lang， language， longdesc， maxlength， media， class， multiple， name， nohref、对象、onblur、onchange、onclick、ondblclick、onfocus、onkeydown、onkeypress、onkeyup、onload、onload、onmousedown、onmousemove、onmouseout、onmouseover、onmouseup、onreset、onselect、onsubmit、onunload、onunload、profile、prompt、readonly、rel、rev、rowspan、scheme、scope、selected、shape、span、src、standby、start、style、summary、title、type（LI、OL 和 UL 元素除外）、usemap、value、valuetype、version。

举个例子，`<input disabled>`input标签上存在disabled属性，而一旦添加了该属性input就会默认有一些样式，也就是浏览器代理设置的样式，这个样式被w3c规定要放入作者源样式中并将特异性置为0，以便后续作者源可以进行再更改。

像disabled这样的属性并不是通过css设置的，所以称为非css表示提示（Non-CSS Presentational Hint）。

#### 特异性（Specificity）

特异性就是我们讲的狭义的css优先级，我们在入门的时候都会听到一些网课老师说什么标签选择器权重是1，类选择器权重是10，id选择器权重是100.....这样的话术，但是实际上并不是权重，w3c规定这个为特异性，而且也不是简单的1、10、100这样标识的，下面我们来具体看看特异性的分配吧：

> 对于给定元素，选择器的特异性计算如下：
>
> - 常规
>
>   - 计算选择器中 ID 选择器的数量 （= A）
>   - 计算选择器中类选择器、属性选择器和伪类的数量 （= B）
>   - 计算选择器中类型选择器和伪元素的数量 （= C）
>   - 忽略通用选择器
>
>   ~~~
>   简单来讲就是这样表示：
>   (A,B,C)
>   从左到右依次比大小，比如先比A，如果不等则选出优胜方，否则继续比B，也就是说A的决定权>B的决定权>C的决定权
>   ~~~
>
> - 如果选择器是选择器列表，则系统会为列表中的每个选择器计算此数量。对于针对列表的给定匹配过程，实际上的特异性是列表中匹配的最具体的选择器的特异性。
>
>   ~~~
>   简单来说就是：
>   .test .test .test
>   这个都算在类选择器列中，得到：
>   (0,3,0)的权重
>   ~~~
>
> - 其他特别情况：
>
>   - :is()、:not()或 :has()伪类的特异性被其选择器列表参数中最具体的复杂选择器的特异性所取代。
>   - 类似地，:nth-child()或 :nth-last-child() 选择器的特异性是伪类本身的特异性（算作一个伪类选择器）加上其选择器列表参数中最具体的复杂选择器的特异性（如果有）。
>   - :where()伪类的特异性被零替换。
>
>   ~~~
>   这些就不太常见，了解就好，例子：
>   :is(em， #foo)在与 <em> 、 <p id=foo> 或 中的任何一个匹配时，具有 （1,0,0） 的特异性 （1,0,0） — 就像 ID 选择器 (#foo) <em id=foo> 一样。
>   .qux:where(em，#foo#bar#baz) 的特异性为 （0,1,0）:只有:where()之外的 .qux 对选择器特异性有贡献。
>   :nth-child(even of li，.item)在与 <li>, <ul class=item>或<li class=item id=foo>中的任何一个匹配时具有 （0,2,0）的特异性（类似于类选择器 （.item） 加上伪类。
>   :not(em， strong#foo) 在与任何元素匹配时具有 （1,0,1） 的特异性，就像标签选择器 （strong） 与 ID 选择器 （#foo） 的组合一样。
>   ~~~

#### 上下文（context）

文档语言可以提供来自不同封装上下文的混合声明，例如DOM中影子树（web组件的内容）的嵌套树上下文。

**其规则为**：当比较来自不同封装上下文的两个声明时，对于普通规则，来自外部上下文的声明获胜，而对于重要规则（!important），来自内部上下文的声明获胜。为此，dom树上下文被视为按包含阴影的树顺序嵌套。

#### 声明顺序（order of appearance）

- 样式表按 [[final CSS style sheets]] 顺序排序。**意思就是最后定义生效。**比如：

  ~~~css
  p {
      color: red;
  }
  p {
      color: black;
  }
  /* black生效 */
  ~~~

- 对导入的样式表中的声明进行排序，就像它们的样式表被替换来代替 @import 规则一样。

- 由原始文档独立链接的样式表中的声明将被视为按链接顺序连接，由主文档语言确定。

- style属性中的声明根据style属性所在的元素的文档顺序进行排序，并且放在任何样式表之后。（这也是style属性优先级高的原因）

**简单来说就一句话：当其他优先级（源优先级、特异性等）都一致，最后声明的样式生效**

### 级联规则

**每一步如果相等才进行下一步比较，不然直接选出优胜方**

- **第一步，比较源等级（1 is highest，8 is lowest）**：
  1. 过渡声明(Transition declarations)
  2. 重要的用户代理声明([Important](https://drafts.csswg.org/css-cascade-4/#important) [user agent](https://drafts.csswg.org/css-cascade-4/#cascade-origin-ua) declarations)
  3. 重要的用户声明([Important](https://drafts.csswg.org/css-cascade-4/#important) [user](https://drafts.csswg.org/css-cascade-4/#cascade-origin-user) declarations)
  4. 重要作者声明([Important](https://drafts.csswg.org/css-cascade-4/#important) [author](https://drafts.csswg.org/css-cascade-4/#cascade-origin-author) declarations)
  5. 动画声明(Animation declarations)
  6. 普通作者声明([Normal](https://drafts.csswg.org/css-cascade-4/#normal) [author](https://drafts.csswg.org/css-cascade-4/#cascade-origin-author) declarations)
  7. 普通用户声明([Normal](https://drafts.csswg.org/css-cascade-4/#normal) [user](https://drafts.csswg.org/css-cascade-4/#cascade-origin-user) declarations)
  8. 普通用户代理声明([Normal](https://drafts.csswg.org/css-cascade-4/#normal) [user agent](https://drafts.csswg.org/css-cascade-4/#cascade-origin-ua) declarations)
- **第二步，比较上下文**
- **第三步，比较特异性**
- **第四步，比较声明顺序**

正常来讲，我们开发的时候源等级都是属于作者优先级范畴的，所以一般不会太在意源等级，上下文考虑的也不多，因为现在很少使用原生web组件，都是使用vue、react等框架，**所以正常来讲我们都是比较特异性和声明顺序**。

### 参考文献

[*CSS current work*& how to participate](https://www.w3.org/Style/CSS/current-work)

[CSS Snapshot 2023](https://www.w3.org/TR/css-2023/)

[CSS Cascading and Inheritance Level 4](https://drafts.csswg.org/css-cascade-4/#cascade-sort)

[Assigning property values, Cascading, and Inheritance](https://www.w3.org/TR/CSS22/cascade.html#cascade)

