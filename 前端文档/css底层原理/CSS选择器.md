### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### 选择器（selectors）

#### 选择器的语法

| 模式                  | 含义                                                         | 描述                 |
| --------------------- | ------------------------------------------------------------ | -------------------- |
| *                     | 任何元素                                                     | 通用选择器           |
| E.C                   | class=C的E元素                                               | 类选择器             |
| E                     | E 类型的元素                                                 | 类型选择器           |
| E[foo]                | 具有 “foo” 属性的 E 元素                                     | 属性选择器           |
| E[foo="bar"]          | 一个 E 元素，其 “foo” 属性值正好等于 “bar”                   | 属性选择器           |
| E[foo~="bar"]         | 一个 E 元素，其 “foo” 属性值是一组以空格分隔的值，其中一个值正好等于 “bar” | 属性选择器           |
| E[foo^="bar"]         | 一个 E 元素，其 “foo” 属性值正好以字符串 “bar” 开头          | 属性选择器           |
| E[foo$="bar"]         | 一个 E 元素，其 “foo” 属性值正好以字符串 “bar” 结尾          | 属性选择器           |
| E[foo*="bar"]         | 一个 E 元素，其 “foo” 属性值包含子字符串 “bar”               | 属性选择器           |
| E[foo\|="en"]         | 一个 E 元素，其 “foo” 属性有一个以连字符分隔的值列表，以 “en” 开头（从左开始） | 属性选择器           |
| E:root                | E 元素，文档的根                                             | 结构伪类选择器       |
| E:nth-child(n)        | E 元素，其父元素的第 n 个子元素                              | 结构伪类选择器       |
| E:nth-last-child(n)   | 一个 E 元素，即其父元素的第 n 个子元素，从最后一个元素开始计数 | 结构伪类选择器       |
| E:nth-of-type(n)      | 一个 E 元素，其类型的第 n 个同级                             | 结构伪类选择器       |
| E:nth-last-of-type(n) | 一个 E 元素，该类型的第 n 个兄弟姐妹，从最后一个开始计数     | 结构伪类选择器       |
| E:first-child         | E 元素，其父元素的第一个子元素                               | 结构伪类选择器       |
| E:last-child          | E 元素，其父元素的最后一个子元素                             | 结构伪类选择器       |
| E:first-of-type       | 一个 E 元素，该类型的第一个同级                              | 结构伪类选择器       |
| E:last-of-type        | 一个 E 元素，其类型的最后一个同级                            | 结构伪类选择器       |
| E:only-child          | E 元素，其父元素的唯一子元素                                 | 结构伪类选择器       |
| E:only-of-type        | E 元素，其类型的唯一同级                                     | 结构伪类选择器       |
| E:empty               | 没有子元素（包括文本节点）的 E 元素                          | 结构伪类选择器       |
| E:link                | 一个 E 元素是目标尚未访问 （：link）                         | link伪类选择器       |
| E:visited             | 一个 E 元素是已访问 （：visited） 的超链接的源锚点           | link伪类选择器       |
| E:active              | 在active用户操作期间出现 E 元素                              | 用户操作伪类选择器   |
| E:hover               | 在hover用户操作期间出现 E 元素                               | 用户操作伪类选择器   |
| E:target              | E 元素作为引用 URI 的目标                                    | 目标伪类选择器       |
| E:lang(fr)            | 语言 “fr” 中 E 类型的元素（文档语言指定如何确定语言）        | :lang()伪类选择器    |
| E:enabled             | 启用的用户界面元素 E                                         | ui元素状态伪类选择器 |
| E:disabled            | 禁用的用户界面元素 E                                         | ui元素状态伪类选择器 |
| E:checked             | 选中的用户界面元素 E（例如单选按钮或复选框）                 | ui元素状态伪类选择器 |
| E::first-line         | E 元素的第一行格式化                                         | 伪元素选择器         |
| E::first-letter       | E 元素的第一个格式化字母                                     | 伪元素选择器         |
| E::before             | E的before伪元素                                              | 伪元素选择器         |
| E::after              | E的after伪元素                                               | 伪元素选择器         |
| E.warning             | 类为 “warning” 的 E 元素（文档语言指定如何确定类）           | 伪元素选择器         |
| E#myid                | ID 等于 “myid” 的 E 元素                                     | ID选择器             |
| E:not(s)              | 与简单选择器 s 不匹配的 E 元素                               | 伪类选择器           |
| E F                   | E 元素的后代 F 元素                                          | 后代运算器           |
| E > F                 | E 元素的 F 元素子元素                                        | 子运算器             |
| E + F                 | 紧接在 E 元素前面的 F 元素                                   | 兄弟运算器           |
| E ~ F                 | F 元素前面有一个 E 元素                                      | 兄弟运算器           |

### 参考文献

[Selectors Level 3](https://www.w3.org/TR/selectors-3/)

[CSS Snapshot 2023 CSS](https://www.w3.org/TR/CSS/#css)
