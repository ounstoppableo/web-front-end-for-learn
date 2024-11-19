### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### 盒模型

话不多说，先上图：

![](.\image\box.png)

这是一个css盒子（块级元素）所拥有的关于设置盒子宽度的属性。

#### 盒模型分类

盒模型根据功能可以分为以下几类：

```
// 视图盒
<visual-box> = content-box | padding-box | border-box
// 布局盒
<layout-box> = <visual-box> | margin-box
// 绘画盒
<paint-box> = <visual-box> | fill-box | stroke-box
// 坐标系盒
<coord-box> = <paint-box> | view-box
```

##### content-edge/content-box

盒边缘 = 元素上定义的width/height属性的大小

而**content-box**就是以content-edge为宽高的盒子

**content-box**为box-sizing默认属性，也就是一般浏览器的默认盒模型，css样式中的宽高定义的就是内容的宽高

在 SVG 上下文中，被视为[fill-box](https://www.w3.org/TR/css-box-3/#valdef-box-fill-box)

##### padding-edge/padding-box

盒边缘 = 元素上定义的width/height属性的大小 + 元素上定义的padding的大小

而**padding-box**就是以padding-edge为宽高的盒子

在 SVG 上下文中，被视为[fill-box](https://www.w3.org/TR/css-box-3/#valdef-box-fill-box)

##### border-edge/border-box

盒边缘 = 元素上定义的width/height属性的大小 + 元素上定义的padding的大小 + 元素上定义的border的大小

在 SVG 上下文中，被视为[stroke-box](https://www.w3.org/TR/css-box-3/#valdef-box-stroke-box)

而**border-box**就是以border-edge为宽高的盒子

**border-box**为box-sizing可选属性之一，以前是怪异盒子的计算方式，所以border-box也被称为怪异盒子，css样式中的宽高定义的就是内容的宽高加上padding和border后的宽高，一般padding和border固定后，为了适配css样式定义的宽高，会对内容的宽高进行压缩

在 SVG 上下文中，被视为[stroke-box](https://www.w3.org/TR/css-box-3/#valdef-box-stroke-box)

##### margin-edge/margin-box

盒宽高 = 元素上定义的width/height属性的大小 + 元素上定义的padding的大小 + 元素上定义的border的大小 + 元素上定义的margin的大小

而**margin-box**就是以margin-edge为宽高的盒子

##### fill-box

指定[object bounding box](https://www.w3.org/TR/SVG2/coords.html#TermObjectBoundingBox)和它的边界

object bounding box是仅包含元素几何形状的边界框。对于基本形状，这是填充的区域

在 CSS 上下文中，被视为[content-box](https://www.w3.org/TR/css-box-3/#valdef-box-content-box)

##### stroke-box

指定 [stroke bounding box](https://www.w3.org/TR/SVG2/coords.html#TermStrokeBoundingBox)和它的边界

stroke bounding box是描边边界框是包含元素的几何形状及其描边形状的边界框

在 CSS上下文中，被视为[border-box](https://www.w3.org/TR/css-box-3/#valdef-box-border-box)

##### view-box

在 CSS 上下文中，被视为[border-box](https://www.w3.org/TR/css-box-3/#valdef-box-border-box)

#### 盒模型注意点

- 盒模型分类中我们开发中使用到的只有content-box和border-box
- 其中fill-box、stroke-box和view-box是svg的盒模型，不要求掌握

### 参考文献

[*CSS current work*& how to participate](https://www.w3.org/Style/CSS/current-work)

[CSS Snapshot 2023](https://www.w3.org/TR/css-2023/)

[CSS Box Model Module Level 3](https://www.w3.org/TR/css-box-3/#typedef-visual-box)

[Chapter 8: Coordinate Systems, Transformations and Units](https://www.w3.org/TR/SVG2/coords.html#TermObjectBoundingBox)