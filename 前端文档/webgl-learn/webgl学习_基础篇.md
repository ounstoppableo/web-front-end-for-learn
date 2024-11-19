### WebGL教程----基础篇

本篇教程更倾向于理论知识，即帮助理解一些数学运算的几何意义，实践部分还需要读者自行训练。

#### WebGL概念介绍

webgl的绘制只关心两件事：**剪裁空间**中的**坐标值**和**颜色值**。而**坐标值**是由**顶点着色器**提供的，**颜色值**是由**片段着色器**提供的。看到这里我们知道了webgl中有两个着色器，而实际上webgl也就只有这两个着色器，所以刚刚开始学习的朋友可以稍微松一口气了~~

##### 着色器

前面我们知道webgl的着色器有两种：顶点着色器、片段着色器。

- 顶点着色器：一个顶点着色器的工作是生成裁剪空间坐标值。

  它一般是通过以下三种方式获取数据：

  - Attributes属性（从缓存中获取数据）(最常用)

    ~~~js
    // 缓冲的使用一般有以下几个过程
    
    // 1.创建缓冲
    var buf = gl.createBuffer();
    // 2.绑定缓冲，第一个参数为绑定点，gl.ARRAY_BUFFER表示绑定到顶点坐标
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // 3.设置数据，someData可以是一些顶点数组
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);
    // 4.获取我们webgl项目中的a_position属性地址，这个属性为顶点存储位置
    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");
    // 5.开启从缓冲中获取数据
    gl.enableVertexAttribArray(positionLoc);
    // 6.告诉WebGL怎么从缓冲中获取数据传递给属性
    var numComponents = 3;  // (x, y, z)
    var type = gl.FLOAT;    // 32位浮点数据
    var normalize = false;  // 不标准化
    var offset = 0;         // 从缓冲起始位置开始获取
    var stride = 0;         // 到下一个数据跳多少位内存
                            // 0 = 使用当前的单位个数和单位长度 （ 3 * Float32Array.BYTES_PER_ELEMENT ）
    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);
    ~~~

  - Uniforms全局变量（在一次绘制中对所有顶点保持一致值）

    ~~~js
    // 1.获取我们webgl项目中的u_offset属性地址
    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");
    // 2.设置该属性
    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // 向右偏移一半屏幕宽度
    ~~~

  - Textures纹理（从像素或纹理元素中获取的数据）

    同片段着色器。

- 片段着色器

  一个片段着色器的工作是为当前光栅化的像素提供颜色值。

  它一般是通过以下三种方式获取数据：

  - Uniforms全局变量（在一次绘制中对所有顶点保持一致值）

    同顶点着色器。

  - Textures纹理（从像素或纹理元素中获取的数据）

    ~~~js
    // 1.给纹理填充数据
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var width = 2;
    var height = 1;
    var data = new Uint8Array([
       255, 0, 0, 255,   // 一个红色的像素
       0, 255, 0, 255,   // 一个绿色的像素
    ]);
    gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 2.获取我们webgl项目中的u_texture属性地址
    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");
    // 3.绑定到一个纹理单元上
    var unit = 5;  // 挑选一个纹理单元
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // 4。使用
    gl.uniform1i(someSamplerLoc, unit);
    ~~~

  - Varings可变量（顶点着色器传递过来的数据）

看不懂上面的代码没关系，只需要知道**着色器是干什么的**，以及**传值的方法有哪些**就行了。

##### GLSL

我们在上面着色器使用的时候常常会遇到**获取webgl项目中XXX属性地址**的情况，这是什么意思呢？实际上我们使用webgl的图形渲染功能并不是通过js实现的，而是通过GLSL（图形库着色器语言）实现的（实际上与着色器通话的语言就是它），而js仅仅是方便我们操作的一个中间件。于是我们可以知道顶点、颜色这些值其实都是通过GLSL定义的，而js正常来讲并不能直接访问，好在webgl为js提供了访问它们的接口，也就是我们每次都要进行的**获取webgl项目中XXX属性地址**操作。

到这里，我们其实可以小小的总结一下webgl的运行规则了。我们前面提到，我们要想让webgl渲染某个图片，只需要提供剪裁空间中的**坐标值**和**颜色值**就行了，而这些实际上就是一些静态数据罢了，GLSL所提供的就是这些静态数据，但是我们希望这些图片需要有动态效果，此时我们就需要使用js来进行值的变更，而webgl学习的难点就在这：如何利用js生成GLSL能读懂的数据值，使GLSL能够正确渲染出数据。

回归正题，GLSL的语法有什么，可以参考[GLSL 中文手册](https://github.com/wshxbqq/GLSL-Card)。

如果学习WebGL之前就学会GLSL，那么学习WebGL将会很快，实际上学习GLSL是无法避开的，所以还请各位好好阅读[GLSL 中文手册](https://github.com/wshxbqq/GLSL-Card)。

我总结一下一些**比较重要的点**：

- GLSL各变量限定符的作用：
  - **attribute**:attribute变量是`全局`且`只读`的,它只能在vertex shader中使用,只能与浮点数,向量或矩阵变量组合, 一般attribute变量用来放置程序传递来的模型顶点,法线,颜色,纹理等数据它可以访问数据缓冲区。
  - **uniform**:uniform变量是`全局`且`只读`的,在整个shader执行完毕前其值不会改变,他可以和任意基本类型变量组合, 一般我们使用uniform变量来放置外部程序传递来的环境数据(如点光源位置,模型的变换矩阵等等) 这些数据在运行中显然是不需要被改变的。
  - **varying**:varying类型变量是 vertex shader 与 fragment shader 之间的信使,一般我们在 vertex shader 中修改它然后在fragment shader使用它,但不能在 fragment shader中修改它。

##### 剪裁空间

我们都知道，要绘制一个图像都需要有画布，而画布上又存在坐标轴，这样我们就可以通过对应的坐标来进行点、线、面的绘制了，而这个画布中的**坐标轴**就被称为**剪裁空间**，在webgl中，无论你的画布多大，其剪裁空间的范围都是0~1，如下图所示：

![](.\images\clip_space_graph.svg)

这个坐标又被称为**归一化设备坐标（NDC）**，未来我们或许会进行像素值到0~1的变换，而这个变换过程就被称为**归一化**。除此之外，我们还需要明确该图的方向，哪边是正哪边是负需要弄清楚。

##### WebGL到底是怎么渲染图像的？

相信读者知道了**着色器**、**GLSL**、**剪裁空间**这些概念，但是对WebGL是如何工作的还是处于懵逼的状态，下面将会对此进行介绍。

**我们先来明确一个概念**：顶点着色器的作用是计算顶点的位置。根据计算出的一系列顶点位置，WebGL可以对点， 线和三角形在内的一些图元进行光栅化处理。当对这些图元进行光栅化处理时需要使用片段着色器方法。 片段着色器的作用是计算出当前绘制图元中每个像素的颜色值。几乎整个WebGL API都是关于如何设置这些成对方法的状态值以及运行它们。 对于想要绘制的每一个对象，都需要先设置一系列状态值，然后通过调用 `gl.drawArrays` 或 `gl.drawElements` 运行一个着色方法对，使得你的着色器对能够在GPU上运行。

简单来讲就是：GLSL定义好状态（状态需要处于剪裁空间）->着色器获取状态（顶点着色器处理结构，片段着色器处理颜色）->GPU光栅化

#### 第一个WebGL项目

第一个webgl项目我画了一个可以改变位移的二维长方形，详情可参考`/examples/first_webgl_program/demo.html`。

其中我们使用到了许多webgl的内置常量，可以在[WebGL 相关常量](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API/Constants)找到其所对应的含义。

#### 二维操作

我们可以想象二维操作都是基于每个点去进行变化的，也就是对a_position进行点位变换。

##### 平移

平移的例子可以参考**第一个WebGL项目**的文件内容，内部定义了一个可以沿x或y轴平移的长方形，其中需要注意的就是平移一般是通过同时改变所有点的(x,y)的位置实现的，也就是为每个a_position添加一个偏移坐标。

##### 旋转

![](.\images\sincos.png)

我们看看上图，是一个单位圆，我们要计算的角度是坐标轴到斜边的角度，根据平行线对角线相等，我们可以知道我们要求的是左上方的角，那么就可以知道其sin和cos分别是x和y。

那我们要如何用sin和cos去计算旋转后的点呢？

~~~glsl
// 我们新增一个用于记录旋转角度的变量，而旋转角度实际上就由sin和cos决定。
uniform vec2 u_rotation;
// 此时我们知道u_rotation有u_rotation.x和u_rotation.y属性，而它们分别对应邻边和对边，也就是x对应cos，y对应sin。
void main() {
  // 旋转位置
  vec2 rotatedPosition = vec2(
     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
     a_position.y * u_rotation.y - a_position.x * u_rotation.x);
	)
}
// 读者可能开始蒙了，怎么刚学了1+1就让我计算微积分了
// 我们将上面的值转换为以下形式可能更好理解，记住该公式代表的是顺时针旋转
// x = x*cosʘ + y*sinʘ
// y = y*cosʘ - x*sinʘ
~~~

如果感兴趣的读者可以阅读其计算原理：

> 假设我们有一个点 P(x, y)，我们想将这个点绕原点 (0, 0)旋转一个角度 θ：
>
> 1. **初始点的表示**：原始点 P 可以用极坐标表示为 (r, ϕ)，其中 r 是点到原点的距离（即模），ϕ是点相对于 x 轴的初始角度。
>    x = rcos(ϕ)
>
>    y = rsin(ϕ)
>
> 2. **旋转后的点**：如果点  P 绕原点旋转了一个角度θ，新的点  P' 的角度将变为 \(ϕ + θ\)，于是：
>    x′ = rcos(ϕ+θ)
>
>    y′ = rsin(ϕ+θ)
>
> 3. **利用三角恒等式**：使用三角函数的和角公式，我们可以进一步展开 x'  和  y' ：
>    cos(ϕ+θ) = cos(ϕ)cos(θ)−sin(ϕ)sin(θ)
>
>    sin(ϕ+θ) = sin(ϕ)cos(θ)+cos(ϕ)sin(θ)
>
>    代入  x  和  y  的值：
>
>    x′ = rcos(ϕ+θ) = r[cos(ϕ)cos(θ)−sin(ϕ)sin(θ)] = xcos(θ)−ysin(θ)
>
>    y′ = rsin(ϕ+θ) = r[sin(ϕ)cos(θ)+cos(ϕ)sin(θ)] = xsin(θ)+ycos(θ)
>
>    然而上面的计算是逆时针的，这个就涉及到三角函数的性质了（需要自己去查查），我们需要对角度取反：
>
>    x′  = xcos(-θ)−ysin(-θ) = xcos(θ) + ysin(θ)
>
>    y′  = xsin(-θ)+ycos(-θ) = ycos(θ) - xsin(θ)

或者直接记住结论也是可以的。

##### 缩放

缩放操作就比较简单了。

~~~glsl
// 新增一个缩放变量
uniform vec2 u_scale;
void main(){
    vec2 scaledPosition = a_position * u_scale;
}
~~~

没错，直接乘就行了，这里应该也不需要过多解释。

##### 矩阵变换

我们知道了二维图像的基本变换了（平移、旋转、缩放），这些变换都是基于a_position去进行点位再计算的，当我们同时只进行一种变换时，比如只进行旋转变换时，可以简单的使用上述方法，然而如果我们是复合变换呢？比如我们既想平移又想旋转还想缩放，那么根据变换的顺序我们得出的最终图像可能会不同？比如：

这是缩放 2, 1 ，旋转30度，然后平移 100, 0 的结果：

![](.\images\f-scale-rotation-translation.svg)

这是平移 100, 0 ，旋转30度，然后缩放 2, 1 的结果：

![](.\images\f-translation-rotation-scale.svg)

如果我们想要**同时拥有这样不同变换顺序的效果**，只能**重新添加一个着色器**了。

但是如果使用矩阵来进行变换计算就可以解决这个问题。

好吧，所以矩阵该怎么用？

首先在二维变换中，我们知道所有操作都是基于x,y的，也就是说其实我们只需要得到一个能与[x,y]进行计算的矩阵就行了，我们纵观平移、旋转、缩放，发现其中旋转的计算最为复杂，它的计算公式如下：

x' = x*cosʘ + y*sinʘ
y' = y*cosʘ - x*sinʘ

要得到这样的公式我们需要得到一个这样的矩阵：

[

cosʘ,-sinʘ,

sinʘ,cosʘ

]

也就是说我们的变换矩阵至少是一个2\*2大小的矩阵，但是当我们计算平移时会发现不太够：

x' = x + tx

y' = y + ty

需要得到这样的矩阵：

[

1,0,

0,1,

tx,ty

]

我们会发现计算平移需要至少2\*3大小的矩阵，计算缩放就简单了：

x' = sx \* x

y' = sy  \* y

需要得到这样的矩阵：

[

sx,0,

0,sy

]

所以综上所述，我们至少需要一个2\*3大小的矩阵。但是我们使用webgl的目的肯定不会只停留在二维，所以我们需要计算的可能还有z轴甚至w轴，但是我们就先以z轴为参考目标，考虑到我们需要计算[x,y,z]，那么我们就需要一个3\*3大小的变换矩阵。

我们的着色器逻辑就可以由：

~~~glsl
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;
 
void main() {
  // 缩放
  vec2 scaledPosition = a_position * u_scale;
 
  // 旋转
  vec2 rotatedPosition = vec2(
     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);
 
  // 平移
  vec2 position = rotatedPosition + u_translation;
}
~~~

转换为：

~~~glsl
}attribute vec2 a_position;
 
uniform vec2 u_resolution;
// 注意我们使用的是3*3的矩阵
uniform mat3 u_matrix;
 
void main() {
  // 将位置乘以矩阵
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;
}
~~~

然后我们要进行复合操作就直接进行矩阵乘法就行了，比如：

~~~js
var m3 = {
  translation: function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },
 
  rotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },
 
  scaling: function(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },
};

// 绘制场景
function drawScene() {
 ,,,
 // 计算矩阵
 var translationMatrix = m3.translation(translation[0], translation[1]);
 var rotationMatrix = m3.rotation(angleInRadians);
 var scaleMatrix = m3.scaling(scale[0], scale[1]);

 // 矩阵相乘
 var matrix = m3.multiply(translationMatrix, rotationMatrix);
 matrix = m3.multiply(matrix, scaleMatrix);

 // 设置矩阵
 gl.uniformMatrix3fv(matrixLocation, false, matrix);

 // 绘制图形
 gl.drawArrays(gl.TRIANGLES, 0, 18);
}
~~~

想要改变顺序只需要改变矩阵相乘的顺序就行啦！

#### 三维

终于进入webgl的重头戏了😘，在此之前各位需要先了解m4库，[这是m4接口文档](https://twgljs.org/docs/index.html)

##### 三维概念

在进入webgl的3d绘图学习之前，我们需要先弄清楚一些3d的概念。

###### 世界矩阵

世界矩阵是3d中非常重要的一个概念，**它用于将物体的局部坐标转换到世界坐标系中**。

- 局部坐标：局部坐标系是与物体关联的坐标系。物体的顶点坐标通常相对于它自身的局部原点表示。例如，一个立方体的顶点坐标可以围绕着它的局部原点(0,0,0)进行定义。

- 世界坐标系：世界坐标系是场景的全局坐标系，它是所有物体的共同参考框架。在这个坐标系中，物体的位置、方向和比例相对于整个场景定义。

- 世界矩阵：

  一个典型的4x4世界矩阵W的形式如下：

  W = [
  	sx,0,0,tx,
  	0,sy,0,ty,
  	0,0,sz,tz,
  	0,0,0,1,
  ]

  其中：

  - sx,sy,sz是缩放因子，分别控制物体在 x、y、z 轴方向上的缩放。
  - tx,ty,tz是平移向量，决定物体在世界空间中的位置。
  - 矩阵的旋转部分（通常位于左上 3x3 子矩阵）决定物体的方向。

**应用场景**：将我们物体的相对局部坐标所呈现的位置转换成世界坐标的位置上。

###### 投影

投影是什么？我们的电脑屏幕是2d的，但是为什么我们能看出某个图形是3d图呢？这就是投影发挥了作用，比如说我有一个矩形：

![](.\images\Snipaste_2024-09-03_13-23-20.png)

我们一眼就知道了它是2d图形，而下面这张：

![](.\images\Cuboid_no_label.svg.png)

我们就会说：哦！这是一个3d图形。它实际上是3d的吗？是3d就不会被我们的电脑装下了，他只是表现出了3d的特征，而这种带给我们3d感觉的现象就被称为**投影**。

我们来总结一下**投影的定义**：三维投影是将三维空间中的物体投射到二维平面上的方法，使其能够在二维介质（如纸张、屏幕）上显示三维效果。

而**投影又分为两类**：**平行投影**和**透视投影**。

它们之间的区分：

- 平行投影不会有近大远小的效果，一般用于精确的绘图
- 透视投影存在近大远小的效果，一般用于增加真实感

而我们上面的图片就是一个平行投影，他的前面和后面不会因为距离的远近而有大小变化。

平行投影这里就不提了，下面着重来讲讲透视投影：

![](.\images\perspective-example.svg)

上图是一张透视图，根据这幅图我们可以简单得出一个结论，(x,y)会随着z轴向负轴延申而变小，所以我们似乎可以利用(x,y)除以z的值从而的到一个简单的透视效果。

但是有一个问题，那就是z在剪裁空间中是(-1,1)，所以除出来不好看到效果，这时候我们就可以设置一个透视因子，这个透视因子乘z值之后就可以用于作为(x,y)的除数了，并且我们还可以通过控制透视因子的大小来监控透视的效果。

~~~glsl
attribute vec4 a_position;

// 透视因子
uniform float u_fudgeFactor;

void main() {
  // 调整除数
  float zToDivideBy = 1.0 + a_position.z * u_fudgeFactor;
  // 计算透视x和y
  gl_Position = vec4(a_position.xy / zToDivideBy, a_position.zw);
}
~~~

假设u_fudgeFactor = 1，那么zToDivideBy就在(0,2)范围内，我们知道朝屏幕z值剪裁空间的坐标为负，那么越朝屏幕zToDivideBy越小，算出的结果就越大，所以可以得到近大远小的效果。

###### 相机

**基本介绍**

相机简单来说就是规定我们的视线范围，如下图：

![](.\images\camera.png)

我们要如何在webgl中定义一个相机呢？

我们知道相机的视线是一个锥型，也就是我们所说的视锥，所以我们需要拥有一个视锥效果，我们可以通过m4.perspective去设置，m4.perspective的效果可参考[m4.perspective可视化解释](https://webglfundamentals.org/webgl/frustum-diagram.html)，这个方法不仅提供了视锥功能，还附带了透视功能，所以我们可以利用它实现相机的视角。

而我们有了视野之后，可能就需要能够变换相机的位置，使其能看向不同的地方，也就是说，其实视锥就类似一个固定视角的相机了，而我们只需要使视锥的朝向或位置发生改变就可以实现视野移动效果了，我们看看下面代码：

~~~js
var cameraAngleRadians = degToRad(0);
var fieldOfViewRadians = degToRad(60);

// 获取一个视锥
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var coneMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

// 获取相机的矩阵
var cameraMatrix = [
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1,
];
// 然后我们可以修改相机的位置
cameraMatrix = m4.translate(cameraMatrix,[0,0,-200]);
cameraMatrix = m4.rotateY(cameraMatrix,cameraAngleRadians);

// 计算基于相机位置的视锥矩阵
var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
~~~

以上代码我们可以实现以下效果：

![](.\images\camera_first.gif)

实际上我们做了什么？

我们设置了一个相机，矩阵是一个单位矩阵，可以想象其位置就是在原点（这个部分在**计算机图形矩阵变换的几何意义**章节会解释），然后我们进行了translate，我们知道屏幕向外是负轴，也就是相机朝屏幕前移动了一点，所以我们就能看到这些物体的全景（初始时相机是位于物体中间的），而rotateY则是使相机绕Y轴进行旋转，也就是相机绕着物体转了一圈，于是达到了上面的效果。

有的人可能希望相机固定不动，然后视野旋转的效果，这个其实就是视角转换。

**视角转换**

我们可以通过一句话实现：

~~~js
cameraMatrix = m4.inverse(cameraMatrix);
~~~

效果如下：

![](.\images\camera_second.gif)

相信看到这里同学们心中带有无限疑惑：

- [ ] 为什么rotateY是相机绕y轴旋转？rotateY不应该是绕着相机局部的轴旋转吗？

- [ ] inverse为什么能切换视角？

- [ ] 为什么能从相机矩阵中获取相机的位置？
- [ ] 这些矩阵最终不都是作用在物体的坐标上吗？相机这些抽象到底是怎么运作的？

诸位的问题将在下一小节解答。

###### 计算机图形矩阵变换的几何意义

我们在进行3d图形操作的时候常常会使用矩阵运算，但是对于初学者会很难理解这些矩阵运算的几何意义，下面我们就来解释解释矩阵运算的几何语言。

**物体矩阵各个点位的含义**

一个常规的物体矩阵：
$$
\left[
\begin{matrix}
r_{11} & r_{12} & r_{13}&t_x \\
r_{21} & r_{22} & r_{23}&t_y \\
r_{31} & r_{32} & r_{33}&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]
$$
比如我们定义一个相机的矩阵，或者空间中某个物体的矩阵，我们就会像这样定义一个4*4的矩阵。

我们来解析一下这个矩阵的结构，怎么解析呢？让它乘一个坐标：
$$
\left[
\begin{matrix}
r_{11} & r_{12} & r_{13}&t_x \\
r_{21} & r_{22} & r_{23}&t_y \\
r_{31} & r_{32} & r_{33}&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]
\left[
\begin{matrix}
x\\y\\z\\w
\end{matrix}
\right]
$$
然后我们可以得到：
$$
x' = r_{11}x+r_{12}y+r_{13}z+tx\\
y' = r_{21}x+r_{22}y+r_{23}z+ty\\
z' = r_{31}x+r_{32}y+r_{33}z+tz\\
w' = w
$$


我们知道平移矩阵为：
$$
\left[
\begin{matrix}
1& 0 & 0&t_x \\
0 & 1 & 0&t_y \\
0 &0 &1&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]
$$
绕x、y、z轴旋转的矩阵分别为：
$$
\left[
\begin{matrix}
1&0&0&0\\
0&cosθ&sinθ&0\\
0&−sinθ&cosθ&0\\
0&0&0&1
\end{matrix}
\right]
$$

$$
\left[
\begin{matrix}
cosθ&0&sinθ&0\\
0&1&0&0\\
−sinθ&0&cosθ&0\\
0&0&0&1
\end{matrix}
\right]
$$

$$
\left[
\begin{matrix}
cosθ&-sinθ&0&0\\
sinθ&cosθ&0&0\\
0&0&1&0\\
0&0&0&1
\end{matrix}
\right]
$$

缩放矩阵为：
$$
\left[
\begin{matrix}
s_x&0&0&0\\
0&s_y&0&0\\
0&0&s_z&0\\
0&0&0&1
\end{matrix}
\right]
$$
好了，现在r的所有位置都被占了，我们应该大致能知道每个r所代表的含义了，虽然有些r可能是多个变换的结果，但是我们有这个印象就行，实际上物体矩阵并不是随便拿几个变换矩阵乘一乘就行了，它还需要注意乘的顺序。比如：
$$
\left[
\begin{matrix}
1& 0 & 0&t_x \\
0 & 1 & 0&t_y \\
0 &0 &1&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]
\left[
\begin{matrix}
1&0&0&0\\
0&cosθ&sinθ&0\\
0&−sinθ&cosθ&0\\
0&0&0&1
\end{matrix}
\right]=
\left[
\begin{matrix}
1&0&0&t_x\\
0&cosθ&sinθ&t_y\\
0&−sinθ&cosθ&t_z\\
0&0&0&1
\end{matrix}
\right]
$$

$$
\left[
\begin{matrix}
1&0&0&0\\
0&cosθ&sinθ&0\\
0&−sinθ&cosθ&0\\
0&0&0&1
\end{matrix}
\right]
\left[
\begin{matrix}
1& 0 & 0&t_x \\
0 & 1 & 0&t_y \\
0 &0 &1&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]=
\left[
\begin{matrix}
1&0&0&t_x\\
0&cosθ&sinθ&t_ycosθ+t_zsinθ\\
0&−sinθ&cosθ&t_zcosθ-t_ysinθ\\
0&0&0&1
\end{matrix}
\right]
$$

可以发现tx和ty位移也旋转了。

物体矩阵的各个点已经弄清楚了，但是还是比较抽象，和实际几何图形很难占上边，所以我们把用途更精确一点：

我先说**结论**：

- tx，ty，tz实际上是物体的类实际坐标
- 每一行的r实际上是物体的坐标方向

接下来是解释。

我们刚刚列举了矩阵会根据相乘顺序的不同得到不同的结果，但是实际上不论是(tx,ty,yz)还是(tx,tycosθ+tzsinθ,tzcosθ-tysinθ)都是物体矩阵的(tx,ty,tz)。因为**物体矩阵表示的是所有计算都完成的最终结果**。那么物体矩阵的(tx,ty,tz)似乎就可以表示某种偏移，如果前面的r是一个单位矩阵，那么实际上物体的实际位置就是相对于(0,0,0)的偏移，也就说(tx,ty,tz)是实际坐标。但是我们存在r不为单位矩阵的情况，我们的x'算出来会与x甚至y和z有关。那我们要怎么描述这个情况下的物体矩阵的(tx,ty,tz)呢？只能说它是一个类实际坐标。但是一般情况下我们会让它替代物体的实际坐标（原因后面解释）。

而每一行r代表的是物体的坐标方向，比如我们看看上面相乘顺序得到不同结果的例子，正常来讲我们平移是不是都是沿着x或y轴进行平移的，所以我们的平移方向就是物体坐标轴的方向，我们看看先经过旋转在进行平移的结果可以发现：
$$
t_y' =t_ycosθ+t_zsinθ\\
t_z' =t_zcosθ-t_ysinθ
$$
这个公式是不是很熟悉，实际上就是我们的旋转变换公式，也就是说物体y和z坐标在x轴上进行旋转了，旋转的角度就是x轴旋转的θ。而又因为这是ty'和tz’，它们是平移量，所以我们可以说物体的z轴和y轴坐标进行了旋转。所以实际上我们就此得到了物体新的坐标体系。

由于每一行r是缩放和旋转的结果，我们来看看缩放：
$$
\left[
\begin{matrix}
s_x&0&0&0\\
0&s_y&0&0\\
0&0&s_z&0\\
0&0&0&1
\end{matrix}
\right]
\left[
\begin{matrix}
1& 0 & 0&t_x \\
0 & 1 & 0&t_y \\
0 &0 &1&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]=
\left[
\begin{matrix}
s_x&0&0&s_xt_x\\
0&s_y&0&s_yt_y\\
0&0&s_z&s_zt_z\\
0&0&0&1
\end{matrix}
\right]
$$
可以发现其并不会改变坐标轴的方向，其只是在原坐标轴上进行缩放。0~tx和0~sztx实际上是在一条线上。所以我们得出结论，**在矩阵对角线上进行变换（缩放）不会影响物体的坐标轴方向，只有旋转才会引起坐标轴方向的变化。**

我们知道r实际上是物体沿各种轴旋转后叠加的结果（忽略缩放），所以实际上它们就可以确定物体坐标轴的方向。让我们说的更精确一点：
$$
(r_{11},r_{12},r_{13}):物体局部x轴方向\\
(r_{21},r_{22},r_{23}):物体局部y轴方向\\
(r_{31},r_{32},r_{33}):物体局部z轴方向
$$
我们再回到上面的例子：

r2 = (0,cosθ,sinθ)，而r2确实改变了y轴的方向；

r3 = (0,-sinθ,cosθ)，而r3也确实改变了z轴的方向。

但是要怎样确认r2和r3是物体y轴和z轴的方向呢？

在二维旋转的时候我们讲过，实际上sinθ、cosθ这些是单位圆上的x，y：

![](.\images\sincos.png)

那么从(0,0,0)到(0,cosθ,sinθ)的方向就是斜边的方向，而其旋转的角度是θ，实际上根据二维旋转的公式(0,ty',0)不就是(0,ty,0)延这个方向旋转的结果吗？而又因为物体y轴的方向是(0,0,0)到(0,ty',0)，所以(0,cosθ,sinθ)实际上就是y轴的方向。r3同理。

到目前为止我们已经证明完了上述的两点结论。但是还存在一些小问题：

- 为什么我们要让(tx,ty,tz)来替代实际物体坐标?

  在还没讲旋转改变坐标轴之前，这个问题完全无法解释，但是讲完旋转后这个问题就迎刃而解了，我们看看下面公式：
  $$
  y' =ycosθ+zsinθ+t_ycosθ+t_zsinθ = (y+t_y)cosθ+(z+t_z)sinθ\\
  z' =zcosθ-ysinθ+t_zcosθ-t_ysinθ = (z+t_z)cosθ-(y+t_y)sinθ
  $$
  这是上面旋转后再平移的例子，(ycosθ+zsinθ,zcosθ-ysinθ)实际上就是物体旋转变换后物体坐标轴的原点，而ty和tz则是基于该原点的平移变换，所以我们可以说物体矩阵的(tx,ty,tz)实际上是经过各种变换后物体最终坐标轴下的物体的位置。**所以(tx,ty,tz)是局部坐标下物体的位置**。

  那它为什么能被作为实际坐标使用呢？我们其实可以回顾我们的webgl项目，可以发现所有矩阵都是乘在一起的，这种情况下就是所有的物体基本上都共用一个变换坐标体系了，比如说我有相机（非实体）和一个物体，相机的实际坐标是相机经过各种变换后的(tx,ty,tz)，而某个物体它实际上也是吃了相机的变换了的，我们之前不是有提到物体要移动到相机的坐标轴下进行变换吗？所以即使使用(tx,ty,tz)是局部坐标，因为变换是一致的，所以它们能被用来表示两个物体间的各种关系。

**webgl矩阵的乘顺序**
$$
P_{clip}=P_{proj}×V_{view}×M_{model}×P_{local}\\
P_{clip}:最终坐标NDC\\
P_{proj}:投影矩阵\\
V_{view}:视图矩阵\\
M_{model}:模型矩阵\\
P_{local}:物体局部矩阵\\
$$

实际上这里有一个坑:

~~~js
const anyMatrix = [
    1,2,3,4,
    5,6,7,8,
    9,10,11,12,
    13,14,15,16
]
// 它其实被webgl读出来是这样的:
// [
//	1,5,9,13,
//  2,6,10,14,
//  3,7,11,15,
//  4,8,12,16,
// ]
// 此时(tx,ty,tz)为(13,14,15)也就是(anyMatrix[12],anyMatrix[13],anyMatrix[14])
~~~

如果改变了顺序会怎么样呢？因为矩阵不支持交换律，所以如果不按照上述位置去定义可能图像会飞，但是如果你对自己每一步想要什么十分清除的话也可以按自己的理解来。

**谈谈改变物体局部坐标体系**

我们看到一些术语常常会说，给某个物体乘一个矩阵，就是把他从局部坐标变换成xxx坐标。比如常见的就是将其从局部坐标变换成世界坐标。

这要怎么理解呢？

先说平移的情况：

比如某个物体给自己定义了(x,y,z)，但是我们世界坐标的原点是在(x1,y1,z1)，也就是我们希望未来物体的变换要基于这个点去进行变换，我们要基于这个点进行平移，怎么做呢？直接给物体加上这个原点就行(x+x1,y+y1,z+z1)，这就将该物体基于世界坐标原点进行平移了，但是未来这个物体要进行变换实际上还是基于局部坐标进行变换，只是它目前的位置已经是相对世界坐标的一个结果了。

再说缩放的情况：

如果世界坐标经过了缩放，如果物体不进行缩放，显然物体在某个坐标轴上会比较大。

最后是旋转的情况：

如果世界坐标发生了旋转，旋转主要关注的还是坐标轴的方向，显然世界坐标轴发生旋转后，坐标轴方向肯定发生了变化，如果我们需要让物体局部坐标轴方向与世界坐标保持一直显然也需要乘世界矩阵。

其实我们简单理解起来就是，**我们某个局部坐标要基于某个其他的坐标轴进行后续的变换工作，而我们只需要乘一个矩阵就行了，这个矩阵可以将局部物体带到相对于该坐标轴的位置，并且应用该坐标轴的方向和缩放。**

而我们其实也可以想到，如果我们不需要某个效果，只需要不乘某个代表这个效果的值就行，而矩阵的什么位置代表什么效果在上面已经介绍过了，比如我们不要旋转效果，那么我们可以把r变为单位矩阵，虽然可能把缩放效果也消除：
$$
\left[
\begin{matrix}
1 & 0 & 0&t_x \\
0 & 1 & 0&t_y \\
0 &0 &1&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]\\
只应用了平移。
$$

**逆矩阵的含义**

我们之前有提到**视角转换**，其实现就是通过乘相机的逆矩阵，那么其原理是什么呢？

我们知道一个矩阵乘其逆矩阵会变为单位矩阵，也就是说**如果一个物体乘了一个矩阵使其发生了变换，可以通过再乘一个逆矩阵恢复成原来的状态**。意思是逆矩阵实际上就是某个矩阵变换的逆变换。那逆变换怎么回事呢？

我们举个简单的例子，比如某个物体乘了一个平移矩阵：
$$
\left[
\begin{matrix}
1 & 0 & 0&t_x \\
0 & 1 & 0&t_y \\
0 &0 &1&t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]\\
$$
我们希望它再变回原来的位置：
$$
\left[
\begin{matrix}
1 & 0 & 0&-t_x \\
0 & 1 & 0&-t_y \\
0 &0 &1&-t_z\\
    0 & 0 & 0&1\\
\end{matrix}
\right]\\
$$


显然上面两个矩阵是互为逆矩阵的（也只能互为逆矩阵，因为定义就是这样），那单独乘下面的矩阵就很直观了，就是往反方向移动；显然缩放也是同理，放大S倍就要缩小S倍，最终表现出来的两个矩阵也是互为逆矩阵的，单独拎出来看逆矩阵的效果就是缩小S倍；那么旋转呢？
$$
\left[
\begin{matrix}
1&0&0&0\\
0&cosθ&sinθ&0\\
0&−sinθ&cosθ&0\\
0&0&0&1
\end{matrix}
\right]\\
$$
上面矩阵是绕x轴旋转，我们先计算其逆矩阵：
$$
\left[
\begin{matrix}
1&0&0&0\\
0&cosθ&-sinθ&0\\
0&sinθ&cosθ&0\\
0&0&0&1
\end{matrix}
\right]\\
$$
其实之前二维操作的时候有介绍过点旋转变换的原理，其中逆时针和顺时针变换差距也就是一个符号调换的问题，上面也是同理，也就是绕着x轴逆旋转。到这里我们已经很明白逆矩阵的效果了，**就是跟原变换矩阵唱反调。**

**所以为什么唱反调能实现视角变换的效果？**

我们来看一个例子，下面是互为逆矩阵的相机矩阵的位置：

![](.\images\Snipaste_2024-09-24_10-12-23.jpg)

假设我们左边是原始相机位置，我们相机矩阵描述的也是这个位置，那么正常情况下如果物体乘这个矩阵，我们的物体就会跑到这个位置：

![](.\images\Snipaste_2024-09-24_10-21-13.jpg)

**但是我们希望的效果是物体在相机的对面，也就是右边相机的位置，所以我们需要将物体坐标变换到右边相机坐标的位置上，于是就需要乘相机矩阵的逆矩阵。**

但是转动视角时还需要考虑一个问题，比如如果我们转动视角，是在相机的逆矩阵上作用效果还是在原相机矩阵上作用效果？显然是先在原矩阵上作用效果再求逆矩阵，我们要清除，相机逆矩阵的目的都是基于原相机矩阵的结果，也就是我们需要得到原相机的具体变换，才能求得相机的逆，这是要想清楚的最基本的问题。

现在我们应该就可以知道逆矩阵是如何进行视角转换的了，然后我们再看下面例子：

![](.\images\Snipaste_2024-09-24_10-30-19.jpg)

是相机往外旋转了一定的角度，这时候假设右边是物体，那么物体就是朝着相机旋转相反的位置旋转了一定的角度，换句话说，现在转动相机的角度实际上就是转动物体的角度，相机转一圈就表示物体转一圈，也就是以下效果：

![](.\images\camera_first.gif)

现在再回头看相机章节提到的四个问题：

- [x] 为什么rotateY是相机绕y轴旋转？rotateY不应该是绕着相机局部的轴旋转吗？
  - 这个是改变物体局部坐标体系的问题
- [x] inverse为什么能切换视角？
  - 逆矩阵知识
- [x] 为什么能从相机矩阵中获取相机的位置？
  - 物体矩阵各个点位的含义
- [x] 这些矩阵最终不都是作用在物体的坐标上吗？相机这些抽象到底是怎么运作的？
  - 通读计算机图形矩阵变换的几何意义章节应该就能有所收获了

到这里我们已经基本能明白webgl矩阵变换的基本知识了，当然叠加起来的效果还是十分复杂，可能有的读者还不能完全理清头绪，但是没关系，大家只要记住一句话：**所有效果归根结底不过是矩阵相乘的顺序不同罢了**。😘

###### 光照

webgl中光照分为三种：**方向光**、**点光源**、**聚光灯**。

- 方向光：指光照均匀的来自某一方向。比如说晴朗天气下的阳光。

  如何计算方向光呢？
  $$
  A·B = |A| |B| cos(θ).
  $$
  我们知道点积公式，假设A和B为**单位向量**，那么我们就可以求得两个向量夹角的余弦值，它有什么用呢？我们知道如果夹角为180度，也就是两个方向相反，余弦值是-1，而如果是同向，也就是0度，余弦值是1，而中间值则是平滑过渡，这个特性不正与我们方向光的照射特性不谋而合吗？物体正对着方向光的方向就能获取所有光，物体处于方向光的照射范围之外就获取不到光。物体正对着方向光就表示两者对向，处于方向光之外表示朝向相同。

  于是我们就可以得到物体获取到方向光的**光照强度**：
  $$
  光照强度 = - 方向光方向 · 物体朝向
  $$
  然后利用光照强度去乘颜色值就可以得到明暗的效果了。

  现在又有一个问题，我们如何获取物体朝向呢？（灯的方向可以随我们定义）

  最简单的方法就是通过**法向量**：

  ![](.\images\normal.png)

  法向量就是物体上的这些刺刺，它们垂直于其所在平面。

  其实法向量很好定义（但如果是圆面的话就当我没说），比如我们针对上图的正方体来定义法向量：

  ~~~js
  function setNormals(gl) {
    // 记住是单位向量，所以都是1
    // 别忘了6行的目的是让两个三角形拼接
    // 剪裁空间中面向屏幕是负轴
    var normals = new Float32Array([
            // 后面，也就是z轴指向
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
   
            // 前面，也就是z轴反向
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
   
            // 顶部，y轴正向
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
        
        	  // 底部，y轴反向
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
   
            // 右面，x轴正向
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
   
            // 左面，x轴反向
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0]);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  }
  ~~~

  然后每个点和方向向量做点积就可以了，每个点计算出光照的强度，这样整体都可以有光照效果了。

  > 实际上我们处理webgl图像要有微观思维，也就是从点到面再到体。

- 点光源：类似如下图：

  ![](.\images\Snipaste_2024-09-03_14-32-29.png)

  方向光可以看成是一个平行光，而点光源到不同位置的表面时都是存在角度的。

  我们要如何模拟这个效果呢？

  我们想象点光源是一个向量点，而平面上也存在无数点，这些点与点光源的连线就构成了点光源到平面不同位置的向量，这个向量怎么算？很简单，两点之间的向量直接相减就行了。

  ~~~glsl
  // 定义点光源位置
  uniform vec3 u_lightWorldPosition;
  // 世界坐标矩阵
  uniform mat4 u_world;
  
  // 计算表面的世界坐标
  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
  // 获取点光源到表面的向量
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
  // 使用时我们要记得归一化，因为我们只需要其方向属性
  // 然后像方向光一样和表面法向量进行点积即可
  ~~~

  **镜面高光效果**：

  我们使用一个镜面对准光源，如果镜面反射的光恰好抵达你的眼睛，你会感觉非常刺眼，我们知道镜面反射的反射光到法线的角度和入射光到法线的角度是一致的：

  ![](.\images\Snipaste_2024-09-04_13-23-36.png)

  实际上入射光的方向就是我们刚刚计算的表面到点光源的方向，而绝对反射方向（光线恰好反射到眼睛）可以直接通过`物体表面 - 相机位置`获取到。也就是如果我们变换物体时，物体表面法线恰好移动到可以平分入射光和绝对反射方向之间的夹角时，此时进入相机的光线是最强的。

  这要怎么表示呢？

  实际上这个平分入射光和绝对反射方向之间的夹角的法线我们可以通过`入射光方向+绝对反射方向`得到（平行四边形法则）

  然后比较方向我们已经很熟练了——直接使用点积。

  ~~~glsl
  uniform vec3 u_lightWorldPosition;
  uniform vec3 u_viewWorldPosition;
  varying vec3 v_surfaceToView;
  
  // 顶点着色器
  void main() {
    // 计算表面的世界坐标
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;
   
    // 计算表面到光源的方向
    // 然后传递到片段着色器
    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
   
    // 计算表面到相机的方向
    // 然后传递到片段着色器
    v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
  }
  
  //片段着色器
  void main() {
    // 由于 v_normal 是可变量，所以经过插值后不再是单位向量，
    // 单位化后会成为单位向量
    vec3 normal = normalize(v_normal);
   
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    // 获取入射光和绝对反射方向之间的夹角的平分线
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
   
    float light = dot(normal, surfaceToLightDirection);
    float specular = dot(normal, halfVector);
   
    gl_FragColor = u_color;
   
    // 只将颜色部分（不包含 alpha） 和光照相乘
    gl_FragColor.rgb *= light;
   
    // 直接加上高光
    gl_FragColor.rgb += specular;
  }
  ~~~

- 聚光灯：实际就是在点光源的基础上加上一个照亮范围，超过这个范围就不照亮

  实现原理也就是为我们余弦计算结果限定一个范围，超过这个范围光线为0，加个if判断就好了

  ~~~glsl
  dotFromDirection = dot(surfaceToLight, -lightDirection)
  if (dotFromDirection >= limitInDotSpace) {
     // 使用光照
  }
  ~~~

##### 三维实战

参见`.\examples\2.first_3d_program`文件夹下的文件，有透视实践案例`perspective.html`和相机实践案例`cermara.html`。以上所说的例子都会在实战中得到体现。

