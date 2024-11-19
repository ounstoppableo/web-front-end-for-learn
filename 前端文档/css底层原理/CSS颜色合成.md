### 导读

本文内容属于css底层原理阅读合集的一个章节，css底层原理阅读包含了从w3c文档阅读方法到css设计原理等一系列内容，能帮助读者深入理解css底层原理，其中就有包含css盒模型、视觉格式模型、继承规则、新功能导览等内容，对入门和进阶前端技术都会有所帮助。

[点我去到css底层原理导览页面~~](https://www.unstoppable840.cn/article/29dae926-a165-4ef7-882a-70a19dcb2108)

### 颜色合成

#### 颜色合成介绍

在css中有一个属性`mix-blend-mode`，它描述了元素的内容应该与元素的直系父元素的内容和元素的背景如何混合，举个例子：

![](.\image\Snipaste_2024-10-17_14-48-33.jpg)

上图是一个1橙色背景的盒子，内部有一个火狐图标，但是当我们改变`mix-blend-mode`的值时，比如:

~~~css
mix-blend-mode: multiply;
~~~

会发生如下变化：

![](.\image\Snipaste_2024-10-17_14-49-45.jpg)

这就是所谓的颜色混合。这个功能有一个很有意思的应用场景，那就是我们的**一键给主体换色的功能**，比如一键给车衣换色、一键给模特换色等。通常这个模式会搭配mask一起使用，但是本篇文章的重点不在这里，本篇文章主要还是介绍`mix-blend-mode`中不同模式下混色的**计算方式**。

#### 相关计算参数与操作介绍

在介绍颜色合成模式的计算方式前，我们需要明确一些计算参数和操作的含义。

##### 计算参数：

- Cr：结果颜色
- B（Cb， Cs）：是混合函数
- Cs：源颜色
- Cb：背景颜色
- αb：背景 Alpha（透明度）
- αs：源的覆盖率
- αo：复合的 alpha 值
- co：输出颜色与输出 alpha [0 <= co <= 1] 的预乘
- Fa：由正在使用的 Porter Duff 运算符定义，粗略表示物体a
- Fb：由正在使用的 Porter Duff 运算符定义，粗略表示物体b

##### 计算操作（Porter Duff运算符）

- clear：未启用任何区域。

  ~~~math
  Fa = 0; Fb = 0\\
  co = 0\\
  αo = 0
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-16-15.jpg)

- copy：将仅显示源。

  ~~~math
  Fa = 1; Fb = 0\\
  co = αs * Cs\\
  αo = αs
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-17-24.jpg)

- destination：将仅显示目标。

  ~~~math
  Fa = 0; Fb = 1\\
  co = αb * Cb\\
  αo = αb
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-18-05.jpg)

- source over：源 放置在目标上。

  ~~~math
  Fa = 1; Fb = 1 – αs\\
  co = αs * Cs + αb * Cb x (1 – αs)\\
  αo = αs + αb * (1 – αs)
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-18-46.jpg)

- destination over：Destination 放置在源之上。

  ~~~math
  Fa = 1 – αb; Fb = 1\\
  co = αs * Cs * (1 – αb) + αb * Cb\\
  αo = αs * (1 – αb) + αb
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-19-30.jpg)

- source in：与目标重叠的源将替换目标。

  ~~~math
  Fa = αb; Fb = 0\\
  co = αs * Cs * αb\\
  αo = αs * αb
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-20-08.jpg)

- destination in：与源重叠的目标替换源。

  ~~~math
  Fa = 0; Fb = αs\\
  co = αb * Cb * αs\\
  αo = αb * αs
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-20-42.jpg)

- source out：源放置在目标之外的位置。

  ~~~math
  Fa = 1 – αb; Fb = 0\\
  co = αs * Cs * (1 – αb)\\
  αo = αs * (1 – αb)
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-21-31.jpg)

- destination out：Destination 放置在源之外的位置。

  ~~~math
  Fa = 0; Fb = 1 – αs\\
  co = αb * Cb * (1 – αs)\\
  αo = αb * (1 – αs)
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-22-05.jpg)

- source atop：与目标重叠的源将替换目标。Destination 放置在其他位置。

  ~~~math
  Fa = αb; Fb = 1 – αs\\
  co = αs * Cs * αb + αb * Cb * (1 – αs)\\
  αo = αs * αb + αb * (1 – αs)
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-22-39.jpg)

- destination atop：与源重叠的 Destination 将替换源。源被放置在其他位置。

  ~~~math
  Fa = 1 - αb; Fb = αs\\
  co = αs * Cs * (1 - αb) + αb * Cb * αs\\
  αo = αs * (1 - αb) + αb * αs
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-23-27.jpg)

- xor：源和目标的非重叠区域将合并。

  ~~~math
  Fa = 1 - αb; Fb = 1 – αs\\
  co = αs * Cs * (1 - αb) + αb * Cb * (1 – αs)\\
  αo = αs * (1 - αb) + αb * (1 – αs)
  ~~~

  ![](.\image\Snipaste_2024-10-17_15-24-05.jpg)

- lighter：显示源图像和目标图像的总和。

  ~~~math
  Fa = 1; Fb = 1\\
  co = αs * Cs + αb * Cb;\\
  αo = αs + αb
  ~~~

#### 颜色合成的模式

颜色合成主要有以下几种模式：

- 可分离颜色（separable）

  - normal

    这是指定不混合的默认属性。混合公式只选择源颜色

    ~~~math
    B(Cb, Cs) = Cs
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-35-58.jpg)

  - multiply

    源颜色乘以目标颜色并替换目标颜色

    结果颜色始终至少与源颜色或目标颜色一样暗。将任何颜色与黑色相乘都会得到黑色。将任何颜色与白色相乘将保留原始颜色（`这个功能就是一键换装的实现原理，因为褶皱一般是黑色阴影`）

    ~~~math
    B(Cb, Cs) = Cb * Cs
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-36-40.jpg)

  - screen

    将背景颜色和原颜色值的补码相乘，然后对结果进行补码

    结果颜色始终至少与两种组成颜色中的任何一种一样亮。用白色筛选任何颜色都会产生白色；用黑色backdrop会保持原始颜色不变。其效果类似于将多个摄影幻灯片同时投影到单个屏幕上

    ~~~math
    B(Cb, Cs) = 1 - [(1 - Cb) * (1 - Cs)]
              = Cb + Cs -(Cb * Cs)
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-37-34.jpg)

  - overlay

    取Multiplies或screens的颜色，取决于背景颜色的值

    源颜色叠加背景，同时保留其高光和阴影。背景颜色不会被替换，而是与源颜色混合，以反映背景的亮度或暗度

    ~~~math
    B(Cb, Cs) = HardLight(Cs, Cb)
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-38-13.jpg)

  - darken

    选择较暗的背景和源颜色

    背景将替换为源较暗的源;否则，它将保持不变

    ~~~math
    B(Cb, Cs) = min(Cb, Cs)
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-38-44.jpg)

  - lighten

    选择背景和源颜色中的较亮颜色

    背景将替换为源较亮的源;否则，它将保持不变

    ~~~math
    B(Cb, Cs) = max(Cb, Cs)
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-39-12.jpg)

  - color-dodge

    使背景颜色变亮以反映源颜色。使用黑色时不会产生任何变化

    ~~~js
    if(Cb == 0)
        B(Cb, Cs) = 0
    else if(Cs == 1)
        B(Cb, Cs) = 1
    else
        B(Cb, Cs) = min(1, Cb / (1 - Cs))
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-39-41.jpg)

  - color-burn

    使背景颜色变暗以反映源颜色。使用白色绘画不会产生任何变化

    ~~~js
    if(Cb == 1)
        B(Cb, Cs) = 1
    else if(Cs == 0)
        B(Cb, Cs) = 0
    else
        B(Cb, Cs) = 1 - min(1, (1 - Cb) / Cs)
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-40-04.jpg)

  - hard-light

    取Multiplies或screens的颜色，取决于源颜色的值，这种效果类似于在背景上照射刺眼的聚光灯

    ~~~js
    if(Cs <= 0.5)
        B(Cb, Cs) = Multiply(Cb, 2 * Cs)
    else
        B(Cb, Cs) = Screen(Cb, 2 * Cs -1)
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-40-52.jpg)

  - soft-light

    使颜色变暗或变亮，具体取决于源颜色值。该效果类似于将漫射聚光灯照射在背景上

    ~~~js
    if(Cs <= 0.5)
            B(Cb, Cs) = Cb - (1 - 2 * Cs) * Cb * (1 - Cb)
        else
            B(Cb, Cs) = Cb + (2 * Cs - 1) * (D(Cb) - Cb)
    with
        if(Cb <= 0.25)
            D(Cb) = ((16 * Cb - 12) * Cb + 4) * Cb
        else
            D(Cb) = sqrt(Cb)
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-41-45.jpg)

  - difference

    从较亮的颜色中减去两种组成颜色中较暗的颜色

    用白色绘画会反转背景颜色;使用黑色绘画不会产生任何变化

    ~~~math
    B(Cb, Cs) = | Cb - Cs |
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-42-11.jpg)

  - exclusion

    产生类似于“差值”模式的效果，但对比度较低。用白色绘画会反转背景颜色;使用黑色时不会产生任何变化

    ~~~math
    B(Cb, Cs) = Cb + Cs - 2 * Cb * Cs
    ~~~

    ![](.\image\Snipaste_2024-10-17_15-42-36.jpg)

- 不可分离颜色（Non-separable)

  辅助函数：

  ~~~js
  Lum(C) = 0.3 x Cred + 0.59 x Cgreen + 0.11 x Cblue
  
  ClipColor(C)
      L = Lum(C)
      n = min(Cred, Cgreen, Cblue)
      x = max(Cred, Cgreen, Cblue)
      if(n < 0)
          C = L + (((C - L) × L) / (L - n))
  
      if(x > 1)
          C = L + (((C - L) × (1 - L)) / (x - L))
  
      return C
  
  SetLum(C, l)
      d = l - Lum(C)
      Cred = Cred + d
      Cgreen = Cgreen + d
      Cblue = Cblue + d
      return ClipColor(C)
  
  Sat(C) = max(Cred, Cgreen, Cblue) - min(Cred, Cgreen, Cblue)
  
  SetSat(C, s)
          if(Cmax > Cmin)
              Cmid = (((Cmid - Cmin) x s) / (Cmax - Cmin))
              Cmax = s
          else
              Cmid = Cmax = 0
          Cmin = 0
          return C;
  ~~~

  - hue

    使用源颜色的色相以及背景颜色的饱和度和亮度创建颜色

    ~~~math
    B(Cb, Cs) = SetLum(SetSat(Cs, Sat(Cb)), Lum(Cb))
    ~~~

    ![](.\image\Snipaste_2024-10-17_16-01-36.jpg)

  - saturation

    使用源颜色的饱和度以及背景颜色的色相和亮度创建颜色。在背景的纯灰色（无饱和度）区域使用此模式绘画不会产生任何变化

    ~~~math
    B(Cb, Cs) = SetLum(SetSat(Cb, Sat(Cs)), Lum(Cb))
    ~~~

    

    ![](.\image\Snipaste_2024-10-17_16-02-12.jpg)

  - color

    使用源颜色的色相和饱和度以及背景颜色的亮度创建颜色。这将保留背景的灰度级别，对于为单色图像着色或为彩色图像着色非常有用

    ~~~math
    B(Cb, Cs) = SetLum(Cs, Lum(Cb))
    ~~~

    ![](.\image\Snipaste_2024-10-17_16-02-48.jpg)

  - luminosity

    使用源颜色的亮度以及背景颜色的色相和饱和度创建颜色。这会产生与 Color 模式相反的效果

    ~~~math
    B(Cb, Cs) = SetLum(Cb, Lum(Cs))
    ~~~

    ![](.\image\Snipaste_2024-10-17_16-03-21.jpg)

### 参考文献

[CSS Snapshot 2023](https://www.w3.org/TR/CSS/#css)

[Compositing and Blending Level 1](https://www.w3.org/TR/compositing-1/#porterduffcompositingoperators)