### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### 有用的规则

#### @color-profile

@color-profile定义并命名了一个颜色配置文件，稍后可以在 `color()` 函数中使用该配置文件来指定颜色。 

使用例子：

~~~css
@color-profile --swop5c {
  src: url("https://example.org/SWOP2006_Coated5v2.icc");
}
.header {
  background-color: color(--swop5c 0% 70% 20% 0%);
}
~~~

#### @import

@import 规则允许用户从其他样式表导入样式规则。如果 @import 规则引用有效的样式表，则用户代理必须将样式表的内容视为是代替 @import 规则编写的，但有两个例外：

- 如果某个功能（例如 @namespace 规则）明确定义它仅适用于特定样式表，而不适用于任何导入的样式表，则它不适用于导入的样式表。
- 如果某个功能依赖于样式表中两个或多个构造的相对顺序（例如要求 @namespace 规则前面不得有除 @import 之外的任何其他规则），则它仅适用于同一样式表中的构造之间。

任何 @import 规则都必须位于样式表中所有其他有效的 at 规则和样式规则之前（忽略 @charset），否则 @import 规则无效。

使用例子：

~~~css
/* 
	@import url;
	@import url list-of-media-queries;
*/
@import url("fineprint.css") print;
@import "custom.css";
~~~

#### @keyframes

@keyframes用于定义动画。

使用例子：

~~~css
@keyframes slidein {
  from {
    transform: translateX(0%);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes slidein {
  0% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(100%);
  }
}
~~~

#### @counter-style

@counter-style规则允许作者定义自定义有序列表前缀样式。

使用例子：

~~~html
<style>
  @counter-style circled-alpha {
    system: fixed;
    symbols: Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ;
    suffix: " ";
  }

  ol {
    list-style: circled-alpha;
  }
</style>

<ol>
      <li>Test</li>
      <li>Test</li>
      <li>Test</li>
      <li>Test</li>
      <li>Test</li>
      <li>Test</li>
      <li>Test</li>
</ol>
~~~

![](.\image\Snipaste_2024-11-19_15-34-18.jpg)

#### @layer

@layer 规则声明一个级联层，可以选择分配样式规则。

使用场景：

- 声明层次化样式
  使用 `@layer` 明确不同来源的样式优先级，例如第三方库样式、项目基础样式、自定义样式等。

- 解决冲突
  避免过度依赖特异性规则来解决样式覆盖问题，使样式更加可控。

使用例子：

~~~css
@layer reset {
    body {
        margin: 0;
        padding: 0;
    }
}

@layer base {
    body {
        font-family: Arial, sans-serif;
        background-color: lightgrey;
    }
}

@layer theme {
    body {
        background-color: white;
    }
}

/*
	样式从低到高优先级：reset → base → theme。
	最终 body 的 background-color 为 white。
*/
~~~

@layer的优先级规则：

- 没有@layer的样式声明优先级大于所有有@layer的样式声明：

  ~~~css
  h1 {
      color: blue;
  }
  
  @layer base {
      h1 {
          color: red;
      }
  }
  /* color为blue */
  ~~~

- 预声明时，优先级从左到右增大：

  ~~~css
  @layer reset, theme;
  
  @layer theme {
      h1 {
          color: black;
      }
  }
  @layer reset {
      h1 {
          color: grey;
      }
  }
  
  /* 此时reset<theme */
  ~~~

- 顺序列举时，优先级从上到下增大

  ~~~css
  @layer reset {
      h1 {
          color: grey;
      }
  }
  
  @layer theme {
      h1 {
          color: black;
      }
  }
  
  /* 此时reset<theme */
  ~~~

有时候我们需要控制通过@import引入的样式的优先级，我们可以这样做：

~~~css
@layer default, theme, components;
@import url(theme.css) layer(theme);
@layer default {
  audio[controls] {
    display: block;
  }
}

/* 这样import引入的优先级就始终小于default的优先级了 */
~~~

#### @property

@property允许开发者显式地定义他们的CSS 自定义属性，允许进行属性类型检查、设定默认值以及定义该自定义属性是否可以被继承，而无需运行任何 JS。它其实是javascript api [registerProperty()](https://drafts.css-houdini.org/css-properties-values-api/#dom-css-registerproperty) 的另一种写法。

使用例子：

~~~css
@property --my-color {
  syntax: "<color>";
  inherits: false;
  initial-value: #c0ffee;
}

.test {
    color: var(--my-color);
}
~~~

#### @scope(支持受限)

范围是文档的子树或片段，选择器可以使用它来进行更有针对性的匹配。范围是通过确定以下内容形成的：

- 范围根节点，充当范围的上限，并且可选
- 范围限制元素，充当下限。

如果满足以下条件，则元素在范围内：

- 它是范围根的后代
- 它不是范围限制的后代。

使用例子：

~~~html
<style>
   /* .Test为上限，.other为下限 */
   @scope (.Test) to (.other) {
     span {
       color: red;
     }
   }
/* 效果：只会选择类为 .Test 内的 <span> 元素，但不会选择 .other 元素内的元素 */
</style>

<div class="Test">
   <span>Test_1</span>
   <div class="other">
     <span>Test_2</span>
   </div>
</div>

~~~

其他写法（内联）：

~~~html
<div class="Test">
   <style>
     @scope {
       span {
         color: red;
       }
     }
   </style>
   <span>Test_1</span>
</div>
<div class="other">
  <span>Test_2</span>
</div>
~~~

按原来不加@scope的内联，所有span都会被作用。

在 `@scope` 块的上下文中， `:scope` 伪类表示作用域根 - 它提供了一种从作用域内部将样式应用到作用域根本身的简单方法：

~~~css
@scope (.feature) {
  :scope {
    background: rebeccapurple;
    color: antiquewhite;
    font-family: sans-serif;
  }
}
/* 这里:scope表示.feature */
~~~

或者也可以使用`&`代替`:scope`，类似scss。

#### @starting-style(支持受限)

@starting-style是一个非常实用的属性，它给元素从`display: none`转换到`display: block`时的初始值。

以前我们定义transition时，总会被一些不是离散变化的属性所困扰，但是一旦有了这个属性，我们就可以解决这个问题了。

使用例子：

~~~html
<style>
    .rect {
      width: 100px;
      height: 100px;
      background-color: aqua;
      transition: all 0.3s ease;
      @starting-style {
        width: 0;
      }
    }
  </style>
<body>
  <div class="rect"></div>
  <button>动画</button>
  <script>
    const btn = document.querySelector("button");
    const rect = document.querySelector(".rect");
    let type = "none";
    btn.onclick = () => {
      type = type === "none" ? "block" : "none";
      rect.style.display = type;
    };
  </script>
</body>
~~~

![](.\image\camera_second_1.gif)

#### @position-try(支持受限)

@position-try用于定义自定义位置尝试后备选项，该选项可用于定义锚定位元素的定位和对齐。可以通过 `position-try-fallbacks` 属性或 `position-try` 简写将一组或多组位置尝试后备选项应用于锚定元素。当定位元素移动到开始溢出其包含块或视口的位置时，浏览器将选择它找到的第一个位置尝试后备选项，将定位元素完全放回屏幕上。

简单来说，就类似于右键菜单，一般是鼠标右边显示，但是靠近边界时就自动往左边显示了，@position-try就是实现这个效果。

使用例子：

~~~html
<style>
  body {
    width: 1500px;
    height: 500px;
  }

  .anchor {
    anchor-name: --myAnchor;
    position: absolute;
    top: 100px;
    left: 350px;
  }
    
  @position-try --custom-left {
    position-area: left;
    width: 100px;
    margin: 0 10px 0 0;
  }

  @position-try --custom-bottom {
    top: anchor(bottom);
    justify-self: anchor-center;
    margin: 10px 0 0 0;
    position-area: none;
  }

  @position-try --custom-right {
    left: calc(anchor(right) + 10px);
    align-self: anchor-center;
    width: 100px;
    position-area: none;
  }

  @position-try --custom-bottom-right {
    position-area: bottom right;
    margin: 10px 0 0 10px;
  }
    
  .infobox {
    position: fixed;
    position-anchor: --myAnchor;
    position-area: top;
    width: 200px;
    margin: 0 0 10px 0;
    position-try-fallbacks: --custom-left, --custom-bottom, --custom-right,
      --custom-bottom-right;
  }
</style>
<div class="anchor">⚓︎</div>
<div class="infobox">
  <p>This is an information box.</p>
</div>
~~~

![](.\image\camera_second.gif)

### 条件规则

#### @media

@media 规则是条件组规则，其条件是媒体查询。

使用例子：

~~~css
@media screen and (min-width: 35em),
       print and (min-width: 40em) {
  #section_navigation { float: left; width: 10em; }
}
~~~

#### @supports

@supports 规则是一个条件组规则，其条件测试用户代理是否支持 `property:value`。作者可以使用它来编写样式表，这些样式表在可用时使用新功能，但在不支持这些功能时优雅地降级。这些查询称为 CSS 功能查询或（通俗地）支持查询。

使用例子：

~~~css
/* 如果不支持grid布局，则使用float布局 */
@supports not (display: grid) {
  div {
    float: right;
  }
}
~~~

#### @container

@container 规则是条件组规则，其条件包含容器查询，该查询是容器大小查询和/或容器样式查询的布尔组合。 @container 规则的 \<block-contents> 块内的样式声明按其条件进行过滤，仅当容器查询对其元素的查询容器为 true 时才匹配。

使用例子：

~~~css
/* 查看h2的祖先元素宽度是否大于400px，大于则h2的font-size为1.5em */
@container (width > 400px) {
  h2 {
    font-size: 1.5em;
  }
}

/* 或者我们可以指定具体的祖先容器 */
.post {
  container-name: sidebar;
}

@container sidebar (width > 400px) {
  h2 {
    font-size: 1.5em;
  }
}
~~~

### 字体规则

#### @font-face

@font-face用于引入新的字体。

使用例子：

~~~html
<style>
	@font-face {
	  font-family: 'Bungee Spice';
	  font-style: normal;
	  font-weight: 400;
	  src: url(https://fonts.gstatic.com/s/bungeespice/v12/nwpTtK2nIhxE0q-IwgSpZBqyxyg_WMON7g.woff2) format('woff2');
	}
</style>

div {
    font-family: 'Bungee Spice';
}
~~~

#### @historical-forms

@historical-forms用于启用历史表格的显示，需要搭配`@font-feature-values`使用：

![](.\image\Snipaste_2024-11-19_14-15-19.jpg)

#### @annotation

@annotation用于启用替代注释形式的显示，需要搭配`@font-feature-values`使用：

![](.\image\Snipaste_2024-11-19_14-09-58.jpg)

#### @ornaments

如果字体中提供了默认字形，则可以使用@ornaments替换默认字形，需要搭配`@font-feature-values`使用。

![](.\image\Snipaste_2024-11-19_14-10-47.jpg)

#### @styleset

@styleset用于启用样式集显示，需要搭配`@font-feature-values`使用：

![](.\image\Snipaste_2024-11-19_14-12-28.jpg)

#### @stylistic

@stylistic用于启用样式替代的显示，需要搭配`@font-feature-values`使用：

![](.\image\Snipaste_2024-11-19_14-13-13.jpg)

#### @swash

@swash用于启用花体字形的显示，需要搭配`@font-feature-values`使用：

![](.\image\Snipaste_2024-11-19_14-11-12.jpg)

#### @character-variant

@character-variant用于启用特定字符变体的显示，需要搭配`@font-feature-values`使用。

#### @font-feature-values

@font-feature-values 允许作者在`font-variant-alternates` 中使用通用名称，用于在 OpenType 中以不同方式激活功能。它允许在使用几种字体时简化 CSS。简单来说就是提供一个预设字体样式，这个字体样式可以通过`font-variant-alternates`属性进行设置。

使用例子：

~~~html
<style>
	@font-feature-values Test {
	  @styleset {
	    user-defined-ident: 4;
	  }
	  ...
	}
</style>

div {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 50px;
        font-family: Arial;
        font-variant-alternates: stylistic(user-defined-ident);
		/* 
    	font-variant-alternates: styleset(user-defined-ident);
		font-variant-alternates: character-variant(user-defined-ident);
		font-variant-alternates: swash(user-defined-ident);
		font-variant-alternates: ornaments(user-defined-ident);
		font-variant-alternates: annotation(user-defined-ident);
		font-variant-alternates: swash(ident1) annotation(ident2); 
    	*/
}
~~~

#### @font-palette-values

@font-palette-values允许自定义由字体制作者创建的字体调色板的默认值。字体作者可能给某些字体预定义了一个调色板，比如按某个顺序0 yellow,1 red，在字体中可能是由上往下的黄到红的渐变色，现在我们可以通过@font-palette-values覆盖字体作者预设的在索引[0,1]上的颜色了，当然，如果字体作者没有设置多个索引，那么即使我们定义再多索引颜色也是没用的。

使用例子：

~~~html
<style>
      @import url(https://fonts.googleapis.com/css2?family=Bungee+Spice);
      @font-palette-values --Alternate {
        font-family: "Bungee Spice";
        override-colors: 0 blue, 1 red;  /* 按索引覆盖颜色 */
      }

      div {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 50px;
        font-family: "Bungee Spice";
        font-palette: --Alternate;
      }
</style>
<div>TEST WORDS</div>
~~~

![](.\image\Snipaste_2024-11-19_14-29-00.jpg)

### 不常用规则

#### @charset

@charset用于指定样式表中使用的字符编码。它必须是样式表中的第一个元素，而前面不得有任何字符。

#### @namespace

@namespace 是用来定义使用在 CSS 样式表中的 XML 命名空间的 @规则。定义的命名空间可以把通配、元素和属性选择器限制在指定命名空间里的元素。

@namespace 规则通常在处理包含多个 namespaces 的文档时才有用，比如 HTML5 里内联的 SVG、MathML 或者混合多个词汇表的 XML。

任何 @namespace 规则都必须在所有的 @charset 和 @import 规则之后，并且在样式表中，位于其他任何style declarations之前。

使用例子：

~~~css
@namespace svg url(http://www.w3.org/2000/svg);

/* 匹配所有的 SVG <a> 元素 */
svg|a {
}
~~~

#### @page

@page用于修改打印页面的不同策略。它的目标是修改页面的尺寸、方向和页边距。

使用例子：

~~~css
/* 针对所有页面 */
@page {
  size: 8.5in 9in;
  margin-top: 4in;
}

/* 针对所有偶数页面 */
@page :left {
  margin-top: 4in;
}

/* 针对所有奇数页面 */
@page :right {
  size: 11in;
  margin-top: 4in;
}

/* 针对所有设置了 `page: wide;` 选择器的页面 */
@page wide {
  size: a4 landscape;
}

@page {
  /* 右上方的空白框显示页码 */
  @top-right {
    content: "Page " counter(pageNumber);
  }
}
~~~

#### @view-transition(支持受限)

@view-transition用于跨网站切换时添加动画效果，比如点击某个a链接跳转到另一个页面，我们希望跳转的过程有一个渐变效果类似ppt切页动画。不过其前置要求太多，有点鸡肋。

[点击查看效果](https://mdn.github.io/dom-examples/view-transitions/mpa/index.html)。

### 参考文献

[CSS Snapshot 2023](https://www.w3.org/TR/css-2023/)

[CSS Animations Level 1](https://drafts.csswg.org/css-animations/#keyframes)

[CSS Transitions Level 2](https://drafts.csswg.org/css-transitions-2/#defining-before-change-style)

[CSS Anchor Positioning](https://drafts.csswg.org/css-anchor-position-1/#at-ruledef-position-try)

[CSS Fonts Module Level 4](https://drafts.csswg.org/css-fonts-4/#at-ruledef-font-feature-values-annotation)

[CSS Counter Styles Level 3](https://drafts.csswg.org/css-counter-styles-3/#at-ruledef-counter-style)

[CSS Color Module Level 5](https://www.w3.org/TR/css-color-5/#at-profile)

[CSS Paged Media Module Level 3](https://drafts.csswg.org/css-page/#at-page-rule)

[CSS View Transitions Module Level 2](https://drafts.csswg.org/css-view-transitions-2/#view-transition-rule)

[CSS Conditional Rules Module Level 3](https://drafts.csswg.org/css-conditional-3/#at-ruledef-media)

[CSS Properties and Values API Level 1](https://drafts.css-houdini.org/css-properties-values-api/#at-property-rule)

[CSS Cascading and Inheritance Level 5](https://drafts.csswg.org/css-cascade-5/#layering)

[CSS Cascading and Inheritance Level 6](https://drafts.csswg.org/css-cascade-6/#scoped-styles)

