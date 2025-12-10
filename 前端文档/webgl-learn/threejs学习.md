### 基础

#### 基本组成模块

我们可以以一个简单的三维世界作为类比——**房间**，房间里有各种**物体**：床、桌子、椅子等等，而我们如果站在门口，就可以通过**眼睛**看到这一切景象。

- **场景**

  场景用于定义一个空间，这个空间作为我们物体展示，也就是上面提到的**房子**。现在，让我们在代码中定义一个场景：

  ~~~ts
  import {
    Scene,
  } from "three";
  const scene = new Scene();
  scene.background = new Color("black");
  ~~~

- **相机**

  其实就类比于我们的**眼睛**，让我们在代码中定义一个相机：

  ~~~ts
  import {
    PerspectiveCamera,
  } from "three";
  
  // 表示视野
  const fov = 35;
  // 横纵比
  const aspect = container.clientWidth / container.clientHeight;
  // 视锥近处平面
  const near = 0.1;
  // 视锥远处平面
  const far = 100;
  const camera = new PerspectiveCamera(fov, aspect, near, far);
  
  // 定义相机位置，这里设置z=10
  camera.position.set(0, 0, 10);
  ~~~

  ![](.\images\perspective_frustum.svg)

  **注意**：通过设置aspect，我们可以将不是均匀分配的x轴和y轴进行拉齐，比如说现在的画布宽高比为1000/500，这时候如果我们设置一个长宽高为(2,2,2)的物体，实际上我们将看到(4,2,2)的物体，这显然不符合我们的要求，此时我们需要在视线上将宽高拉齐，也就是设置aspect。

- **物体**

  物体也就是我们上面提到的房间里的物品了，假设我们定义两个物体，一个球和一个正方体：

  ~~~ts
  import {
    BoxGeometry,
    SphereGeometry,
  } from "three";
  
  onst boxGeometry = new BoxGeometry(2, 2, 2);
  const bollGeometry = new SphereGeometry(
    2, // 半径
    32, // 横向分段（越大越圆）
    32 // 纵向分段
  );
  
  const material = new MeshBasicMaterial({ color: 0x00ff00 });
  // 我们可以理解Geometry为框架，material为皮肤材质
  const cube = new Mesh(boxGeometry, material);
  const boll = new Mesh(bollGeometry, material);
  // 由于初始物体在(0,0,0)坐标的位置，为了不重叠，我们将boll稍微在x轴上进行移动
  boll.position.set(-6, 0, 0);
  
  // 添加到场景中
  scene.add(cube);
  scene.add(boll);
  ~~~

- 渲染器

  好了，到这里，我们一个三维场景已经搭建完毕了，现在的问题就是我如何将这样的三维场景渲染到页面上，下面我们就需要操作渲染器了：

  ~~~ts
  import {
    WebGLRenderer,
  } from "three";
  
  // 我们要渲染到的容器，div
  const container = document.querySelector("#scene-container");
  
  // 创建一个渲染器，也就是canvas
  const renderer = new WebGLRenderer();
  // 设置渲染器大小，也就是canvas的大小
  renderer.setSize(container.clientWidth, container.clientHeight);
  // 设置缩放比
  renderer.setPixelRatio(window.devicePixelRatio);
  // 将canvas添加至我们的容器中
  container.appendChild(renderer.domElement);
  // 渲染
  renderer.render(scene, camera);
  ~~~

现在让我们看看完整的案例：

~~~ts
import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";

const container = document.querySelector("#scene-container");

// 添加场景
const scene = new Scene();
scene.background = new Color("black");

// 添加相机
const fov = 35;
const aspect = container.clientWidth / container.clientHeight;
const near = 0.1;
const far = 100;
const camera = new PerspectiveCamera(fov, aspect, near, far);
let radius = 10;
camera.position.set(0, 0, radius);

const boxGeometry = new BoxGeometry(2, 2, 2);
const bollGeometry = new SphereGeometry(
  2, // 半径
  32, // 横向分段（越大越圆）
  32 // 纵向分段
);

// 添加物体
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(boxGeometry, material);
const boll = new Mesh(bollGeometry, material);
boll.position.set(-6, 0, 0);
scene.add(cube);
scene.add(boll);

// 添加渲染器
const renderer = new WebGLRenderer();
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);
renderer.render(scene, camera);

// 动画
let angle = 0;
function animate() {
  requestAnimationFrame(animate);

  angle += 0.01;

  camera.position.x = Math.sin(angle) * radius;
  camera.position.z = Math.cos(angle) * radius;

  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

animate();
~~~

![](.\images\first_threejs.gif)

#### 代码整理

为了让我们的项目具有可拓展性，并且逻辑整理更清晰，我们将上面提到的每个模块都拆分成一个个文件，以此为单元进行组合：

我们的文件结构如下：

> - worldApp
>   - components - 用于存储实体`Object3D`的子类
>     - camera.js - 相机
>     - cube.js - 正方体
>     - scene.js - 场景
>   - systems - 用于放置系统设置相关
>     - renderer.js - 渲染器
>   - world.js - 世界入口
>   - main.js - 应用程序入口

~~~ts
// main.js

import World from "./world";

function main() {
  const container = document.querySelector("#scene-container");
  const world = new World(container);
  world.render();
}

main();
~~~

~~~ts
// world.js

import createCamera from "./components/camera";
import createCube from "./components/cube";
import createScene from "./components/scene";
import createRenderer from "./systems/renderer";

// 用这种方式实现私有性
let scene;
let camera;
let cube;
let renderer;
let resizer;
export default class World {
  constructor(container) {
    scene = createScene();
    camera = createCamera();
    cube = createCube();
    scene.add(cube);
    renderer = createRenderer(container);
  }
  render() {
    renderer.render(scene, camera);
  }
}
~~~

~~~js
// components/camera.js

import { PerspectiveCamera } from "three";

function createCamera() {
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 10;
  return camera;
}

export default createCamera;
~~~

~~~ts
// components/scene.js

import { Scene } from "three";

function createScene() {
  const scene = new Scene();
  scene.background = "black";
  return scene;
}

export default createScene;
~~~

~~~ts
// components/cube.js

import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";

function createCube() {
  const geometry = new BoxGeometry(2, 2, 2);
  const material = new MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new Mesh(geometry, material);
  return cube;
}

export default createCube;
~~~

~~~ts
// systems/renderer.js

import { WebGLRenderer } from "three";

function createRenderer(container) {
  const renderer = new WebGLRenderer();
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.append(renderer.domElement);
  return renderer;
}
export default createRenderer;
~~~

至此，我们就得到了一个逻辑功能清晰的three.js应用。

#### 场景图

在Three.js中，我们所知的所有实体（相机、场景、物体）都属于Object3D的子类，它们按树状进行布局：

![](.\images\Snipaste_2025-12-09_14-27-20.jpg)

![](.\images\Snipaste_2025-12-09_16-15-16.jpg)

Group可以作为一个组件抽象，本身不具备几何信息，但是可以用于管理一系列相关物体。

#### 变换坐标系

根据前面的重构，我们可以得到一个这样的场景：

![](.\images\Snipaste_2025-12-09_14-10-41.jpg)

怎么会是2D？其实图中确实是3D场景，只不过是由于我们的相机处于正前方，所以只能看到其正面，现在，让我们学习坐标系的知识，以看清其其他面吧！

首先我们需要了解坐标系，坐标系分为**世界坐标系**和**局部坐标系**。

这些坐标系都是笛卡尔坐标系，也就是：

![](.\images\coordinate_system_simple.svg)

在three.js中，坐标系是右手坐标系。

其中**世界坐标系**表示的是一个全局的、整体的坐标系，也就是以我们屏幕正中央为原点，按照右手坐标系向其他地方延申的坐标系，是一个固定的不会变的坐标系。

而**局部坐标系**则是相对于某个Object3D实体所构建的坐标系。

让我们在实践中看看吧：

~~~ts
scene.add(meshA);
meshA.add(meshB);
~~~

假设此时scene就是世界，我们在scene中添加了meshA，又在meshA中添加了meshB。

~~~ts
meshA.position.x = 5;
~~~

此时我们可以很简单的计算出，meshA的最终位置为(5,0,0)，因为是根据世界坐标来计算的。

~~~
meshB.position.x = 3;
~~~

此时又如何呢？meshB基于的是meshA的局部坐标，也就是(5,0,0)的位置是meshA局部坐标中的原点，所以meshB的坐标应该为(8,0,0)。

~~~ts
scene.add(meshB)
~~~

如果我们执行这样的操作，meshB将会从meshA中被移动到scene中，此时meshB的坐标也将会变成(3,0,0)。

现在让我来认识基础变换操作：平移、缩放、旋转。

我们先将相机位置稍微调后一点：

~~~ts
import { PerspectiveCamera } from "three";

function createCamera() {
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 50;
  return camera;
}

export default createCamera;

~~~

~~~ts
import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import { Vector3 } from "three/src/math/Vector3.js";
import { Euler } from "three/src/math/Euler.js";
import { MathUtils } from "three";

function createCube() {
  const geometry = new BoxGeometry(2, 2, 2);
  const material = new MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new Mesh(geometry, material);
  cube.position.copy(new Vector3(5, 5, 5));
  cube.scale.copy(new Vector3(5, 5, 5));
  cube.rotation.copy(
    new Euler(
      MathUtils.degToRad(45),
      MathUtils.degToRad(45),
      MathUtils.degToRad(45)
    )
  );
  return cube;
}

export default createCube;
~~~

![](.\images\Snipaste_2025-12-09_14-51-26.jpg)

好了，我们进行了一个简单的变换，其中Vector是向量，Euler是欧拉角。

我们也可以使用变换矩阵：

~~~ts
mesh.matrix = new Matrix4();
~~~

实际上，我们上面调用的函数会先将其转换成变换矩阵再进行绘制。

变换矩阵需要相应的线性代数知识，这里就不过多深入。

#### 照明

在上面的例子中，我们的正方体貌似还是差了点意思（感觉面没有分明）。

这其实和用光有关，接下来我们将学习如何用光。

在three.js中光分为两种：

- 直接光照：模拟直接光照
- 环境光：这是 *一种* 廉价且可信的间接照明方式

> **间接照明**：光线在击中物体之前已经从墙壁和房间内的其他物体反弹，每次反弹都会改变颜色并失去强度

##### 直接光照

关于直接照明，three.js提供了几种光源：

- **`DirectionalLight` => 阳光**
- **`PointLight` => 灯泡**
- **`RectAreaLight` => 条形照明或明亮的窗户**
- **`SpotLight` => 聚光灯**

现在我们利用DirectionalLight来加入到我们的项目中：

~~~ts
// components/light.js

import { DirectionalLight } from "three";

function createDirectionalLight() {
  const directionalLight = new DirectionalLight(0xffffff, 5);
  directionalLight.position.set(20, 20, 20);
  return directionalLight;
}
export default createDirectionalLight;
~~~

~~~ts
// world.js
import createCamera from "./components/camera";
import createCube from "./components/cube";
import createDirectionalLight from "./components/directionalLight"; // +
import createScene from "./components/scene";
import createRenderer from "./systems/renderer";

let scene;
let camera;
let cube;
let renderer;
let resizer;
let light;
export default class World {
  constructor(container) {
    scene = createScene();
    camera = createCamera();
    cube = createCube();
    light = createDirectionalLight(); // +
    scene.add(cube);
    scene.add(light); // +
    renderer = createRenderer(container);
  }
  render() {
    renderer.render(scene, camera);
  }
}
~~~

此时我们发现我们的图像几乎没什么变化，这是怎么回事？主要是我们使用的是`MeshBasicMaterial`材质，这是一个无法响应光线的材质，我们应该替换成`MeshStandardMaterial`。

~~~ts
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial, // + 
} from "three";
import { Vector3 } from "three/src/math/Vector3.js";
import { Euler } from "three/src/math/Euler.js";
import { MathUtils } from "three";

function createCube() {
  const geometry = new BoxGeometry(2, 2, 2);
  const material = new MeshStandardMaterial({ color: 0x00ff00 });  // +
  const cube = new Mesh(geometry, material);
  cube.position.copy(new Vector3(5, 5, 5));
  cube.scale.copy(new Vector3(5, 5, 5));
  cube.rotation.copy(
    new Euler(
      MathUtils.degToRad(45),
      MathUtils.degToRad(45),
      MathUtils.degToRad(45)
    )
  );
  return cube;
}

export default createCube;
~~~

![](.\images\Snipaste_2025-12-09_15-08-13.jpg)

现在是不是好多了。

##### 环境光

现在我们看着没什么问题，但假设我们的光线处于物体之后：

~~~ts
import { DirectionalLight } from "three";

function createDirectionalLight() {
  const directionalLight = new DirectionalLight(0xffffff, 5);
  directionalLight.position.set(20, 0, -20); // +
  return directionalLight;
}
export default createDirectionalLight;

~~~

![](.\images\Snipaste_2025-12-09_15-15-32.jpg)

我们发现物体出现了死黑，按理说，在现实光照环境中，由于反射的作用，即使是背光，也不会出现完全死黑，要模仿这样的场景，我们需要使用到环境光。

在three.js中有两类环境光类：

- **AmbientLight**：是在three.js中伪造间接照明的最廉价的方法。这种类型的光会从各个方向向场景中的每个对象添加恒定数量的光照。放置此灯的位置无关紧要，相对于灯光放置其他对象的位置也无关紧要。这与现实世界中光的工作方式完全不同。尽管如此，结合一个或多个直射光一起使用，`AmbientLight`效果还不错。

  ~~~ts
  // components/ambientLight.js
  import { AmbientLight } from "three/src/lights/AmbientLight.js";
  
  function createAmbientLight() {
    const ambientLight = new AmbientLight("white", 2);
    return ambientLight;
  }
  export default createAmbientLight;
  ~~~

  ~~~js
  // world.js
  //...
  ambientLight = createAmbientLight();
  scene.add(ambientLight);
  // ...
  ~~~

  ![](.\images\Snipaste_2025-12-09_15-26-23.jpg)

  它其实很类似直射，如果将强度设置为直射光的强度，那么正方体的面将再次糊成一片，只不过其比直射光更廉价。

- **HemisphereLight**：在场景顶部的天空颜色和场景底部的地面颜色之间渐变。与`AmbientLight`一样，此灯不尝试物理精度。相反，`HemisphereLight`是在观察到在您发现人类的许多情况下创建的，最亮的光来自场景的顶部，而来自地面的光通常不太亮。

  例如，在典型的户外场景中，物体从上方被太阳和天空照亮，然后从地面反射的阳光中接收二次光。同样，在室内环境中，最亮的灯通常位于天花板上，这些灯会反射到地板上以形成昏暗的二次照明。

  ~~~ts
  // components/hemisphereLight.js
  
  import { HemisphereLight } from "three/src/lights/HemisphereLight.js";
  function createHemisphereLight() {
    const hemisphereLight = new HemisphereLight(
      "white", // bright sky color
      "darkslategrey", // dim ground color
      5 // intensity
    );
    return hemisphereLight;
  }
  export default createHemisphereLight;
  ~~~

  ~~~ts
  // world.js
  //...
  hemisphereLight = createHemisphereLight();
  scene.add(hemisphereLight);
  // ...
  ~~~

  我们完全清除ambientLight后再加入hemisphereLight的效果如下：

  ![](.\images\Snipaste_2025-12-09_15-31-35.jpg)

  即使设置了光强度和普通直射光一致，也不会有正方体面糊在一起的情况。

#### 插件

在欣赏three.js项目时，我们经常会遇到利用拖拽方式就可以改变相机位置的情况，这个可以通过three.js官方提供的插件实现，现在我们就以这个插件为例学习一下插件安装的流程。

~~~ts
// systems/controls.js

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function createControls(camera, renderer, scene) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", () => {
    renderer.render(scene, camera);
  });
  return controls;
}
export default createControls;
~~~

~~~ts
// world.js

import createAmbientLight from "./components/ambientLight";
import createCamera from "./components/camera";
import createCube from "./components/cube";
import createDirectionalLight from "./components/directionalLight";
import createHemisphereLight from "./components/hemisphereLight";
import createScene from "./components/scene";
import createControls from "./systems/controls"; // +
import createRenderer from "./systems/renderer";

let scene;
let camera;
let cube;
let renderer;
let resizer;
let light;
let hemisphereLight;
export default class World {
  constructor(container) {
    scene = createScene();
    camera = createCamera();
    cube = createCube();
    light = createDirectionalLight();
    hemisphereLight = createHemisphereLight();
    scene.add(cube);
    scene.add(light);
    scene.add(hemisphereLight);
    renderer = createRenderer(container);
    const controls = createControls(camera, renderer, scene); // +
  }
  render() {
    renderer.render(scene, camera);
  }
}
~~~

使用很简单，也就是可以利用该插件控制相机位置，然后监听change事件进行再渲染。

#### 纹理

纹理是让我们的物体拥有更多样的皮肤的方式。

一般来说，纹理都是2d的，我们要如何将2d的纹理应用于3d中呢？这时使用的技术就是UV映射，其实也不算是技术，就是将2维坐标映射到3维坐标上。比如(u,v)=>(x,y,z)。一般来说uv映射文件中写满了这样的映射，将每个2维像素点映射到三维上，当然这是由机器生成的，如果让人来做这个工作会累死的。

一个应用案例：

![](.\images\Snipaste_2025-12-09_15-52-28.jpg)

![](.\images\Snipaste_2025-12-09_15-52-45.jpg)

好了，现在我们来学习如何使用纹理：

~~~ts
// components/texture.js

import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial.js";
function createTexture() {
  const textureLoader = new TextureLoader();
  const texture = textureLoader.load("/textures/uv-test-bw.png");
  const material = new MeshStandardMaterial({
    map: texture,
  });
  return material;
}
export default createTexture;
~~~

~~~js
// components/cube.js

import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import { Vector3 } from "three/src/math/Vector3.js";
import { Euler } from "three/src/math/Euler.js";
import { MathUtils } from "three";
import createTexture from "./texture";

function createCube() {
  const geometry = new BoxGeometry(2, 2, 2);
  const material = createTexture(); // +
  const cube = new Mesh(geometry, material);
  createTexture();
  cube.position.copy(new Vector3(5, 5, 5));
  cube.scale.copy(new Vector3(5, 5, 5));
  cube.rotation.copy(
    new Euler(
      MathUtils.degToRad(45),
      MathUtils.degToRad(45),
      MathUtils.degToRad(45)
    )
  );
  return cube;
}

export default createCube;
~~~

上面代码更新好之后，会出现一个问题，就是初始正方体是黑色的，这是由于textureLoader.load加载是异步填充的，同步返回时返回的是空的实例，所以刚开始是黑色的。

成功加载后：

![](.\images\Snipaste_2025-12-09_16-10-22.jpg)

在这里我们并没有使用UV映射文件，默认使用的是平铺映射，也就是图片会铺满每个面（类似object-fit: fill）。

#### 一个整体例子

现在，我们做一个小火车。

![](.\images\Snipaste_2025-12-09_16-19-32.jpg)

从中我们可以知道几个基本几何物体：

- CylinderGeometry：柱状体/锥体
- BoxGeometry：方体

现在就是将这几个物体进行组合：

首先是**箱形货舱**。一个`BoxBufferGeometry`就够了。使用以下参数创建一个：

| 长度 | 宽度 | 高度 |
| ---- | ---- | ---- |
| 2    | 2.25 | 1.5  |

接下来，使用以下参数为**鼻子**创建第一个`CylinderGeometry`：

| 顶部半径 | 底部半径 | 高度 | 径向段 |
| -------- | -------- | ---- | ------ |
| 0.75     | 0.75     | 3    | 12     |

我们可以为所有**四个轮子**重复使用一个`CylinderGeometry`，甚至是大后轮。您可以在任意数量的网格中重复使用几何体，然后为每个网格更改`.position`、`.rotation`和`.scale`。这比为每个网格创建新几何体更有效，您应该尽可能这样做。使用以下参数创建圆柱几何体：

| 顶部半径 | 底部半径 | 高度 | 径向段 |
| -------- | -------- | ---- | ------ |
| 0.4      | 0.4      | 1.75 | 16     |

最后是**烟囱**。它是一个圆锥体，而不是圆柱体，但如上所述，如果我们创建一个`radiusTop`和`radiusBottom`具有不同值的圆柱体几何体，结果将是一个圆锥体形状。这一次，保留`radialSegments`默认值8。

| 顶部半径 | 底部半径 | 高度 | 径向段        |
| -------- | -------- | ---- | ------------- |
| 0.3      | 0.1      | 0.5  | default value |

在构建火车实体之前，我们可以在场景中添加网格，以方便知道我们物体所在的位置：

~~~ts
// components/helper.js

import { AxesHelper, GridHelper } from "three";

function createAxesHelper() {
  const helper = new AxesHelper(3);
  helper.position.set(-3.5, 0, -3.5);
  return helper;
}

function createGridHelper() {
  const helper = new GridHelper(6);
  return helper;
}

export { createAxesHelper, createGridHelper };
~~~

~~~ts
import createAmbientLight from "./components/ambientLight";
import createCamera from "./components/camera";
import createDirectionalLight from "./components/directionalLight";
import { createAxesHelper, createGridHelper } from "./components/helper"; // +
import createHemisphereLight from "./components/hemisphereLight";
import createScene from "./components/scene";
import Train from "./components/train";
import createControls from "./systems/controls";
import { Loop } from "./systems/loop";
import createRenderer from "./systems/renderer";

let scene;
let camera;
let renderer;
let resizer;
let light;
let hemisphereLight;
let loop;
export default class World {
  constructor(container) {
    scene = createScene();
    camera = createCamera();
    light = createDirectionalLight();
    hemisphereLight = createHemisphereLight();
    scene.add(createAxesHelper(), createGridHelper()); // +
    scene.add(light);
    scene.add(hemisphereLight);
    renderer = createRenderer(container);
    const controls = createControls(camera, renderer, scene);
  }
  render() {
    renderer.render(scene, camera);
  }
}
~~~

现在我们添加小火车实体：

~~~ts
import {
  Group,
  MeshStandardMaterial,
  BoxGeometry,
  Mesh,
  CylinderGeometry,
} from "three";

// 材质
function createMaterials(type) {
  if (type === "body") {
    return new MeshStandardMaterial({
      color: "firebrick",
      // 用于将光滑的面变成有棱角的面
      flatShading: true,
    });
  } else {
    return new MeshStandardMaterial({
      color: "darkslategray",
      flatShading: true,
    });
  }
}

// 部件
function createCabin() {
  const cabin = new Mesh(
    new BoxGeometry(2, 2.25, 1.5),
    createMaterials("body")
  );
  cabin.position.set(1.5, 1.4, 0);
  return cabin;
}
function createNose() {
  const nose = new Mesh(
    new CylinderGeometry(0.75, 0.75, 3, 12),
    createMaterials("body")
  );
  nose.position.set(-1, 1, 0);
  nose.rotation.z = Math.PI / 2;
  return nose;
}
function createWheel(radius) {
  const wheel = new Mesh(
    new CylinderGeometry(radius, radius, 1.75, 16),
    createMaterials("detail")
  );
  wheel.position.y = 0.5;
  wheel.rotation.x = Math.PI / 2;
  return wheel;
}
function createChimney() {
  const chimney = new Mesh(
    new CylinderGeometry(0.3, 0.1, 0.5),
    createMaterials("detail")
  );
  chimney.position.set(-2, 1.9, 0);
  return chimney;
}
const wheelSpeed = MathUtils.degToRad(24);
let bigWheel;
let smallWheel1;
let smallWheel2;
let smallWheel3;

class Train extends Group {
  constructor() {
    super();
    bigWheel = createWheel(0.8);
    bigWheel.position.x = 1.5;
    smallWheel1 = createWheel(0.4);
    smallWheel2 = smallWheel1.clone();
    smallWheel2.position.x = -1;
    smallWheel3 = smallWheel2.clone();
    smallWheel3.position.x = -2;
      
    // 组装部件
    this.add(
      createCabin(),
      createNose(),
      createChimney(),
      bigWheel,
      smallWheel1,
      smallWheel2,
      smallWheel3
    );
  }
    
  // 用于轮子转动动画
  tick(delta) {
    bigWheel.rotation.y += delta * wheelSpeed;
    smallWheel1.rotation.y += delta * wheelSpeed;
    smallWheel2.rotation.y += delta * wheelSpeed;
    smallWheel3.rotation.y += delta * wheelSpeed;
  }
}
export default Train;
~~~

为了让轮子转动，我们需要添加一个动画控制模块：

~~~ts
import { Clock } from "three";

const clock = new Clock();

class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.updatables = [];
  }

  start() {
    // 动画帧渲染，类似requestAnimationFrame
    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  tick() {
    // 用于获取动画帧的间隔时间，用 speed*间隔时间 就可以做到在不同fps下能够显现出同样的位移
    const delta = clock.getDelta();
    for (const object of this.updatables) {
      object.tick(delta);
    }
  }
}

export { Loop };
~~~

~~~ts
import createAmbientLight from "./components/ambientLight";
import createCamera from "./components/camera";
import createCube from "./components/cube";
import createDirectionalLight from "./components/directionalLight";
import { createAxesHelper, createGridHelper } from "./components/helper";
import createHemisphereLight from "./components/hemisphereLight";
import createScene from "./components/scene";
import createControls from "./systems/controls";
import createRenderer from "./systems/renderer";
import Train from "./components/train"; // +
import { Loop } from "./systems/loop"; // +

let scene;
let camera;
let train; // +
let renderer;
let resizer;
let light;
let hemisphereLight;
let loop; // +
export default class World {
  constructor(container) {
    scene = createScene();
    camera = createCamera();
    train = new Train(); // +
    light = createDirectionalLight();
    hemisphereLight = createHemisphereLight();
    scene.add(createAxesHelper(), createGridHelper());
    scene.add(train); // +
    scene.add(light);
    scene.add(hemisphereLight);
    renderer = createRenderer(container);
    const controls = createControls(camera, renderer, scene);
    loop = new Loop(camera, scene, renderer); // +
    loop.updatables.push(train); // +
    loop.start(); // +
  }
  render() {
    renderer.render(scene, camera);
  }
}
~~~

效果如下：

![](.\images\train.gif)

#### 加载外部模型

大多数情况下，我们都不会在three.js中直接画模型，而是使用更专业的软件（比如blender）画好模型后，再导入到three.js，一般three.js可以识别的是glTF文件，也就是后缀名为`.glb`的文件。

~~~ts
// components/externalObj.js

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
function setupModel(data) {
  const model = data.scene.children[0];
  return model;
}
async function createExternalObj(src) {
  const loader = new GLTFLoader();
  const externalObjData = await loader.loadAsync(src);
  return setupModel(externalObjData);
}
export default createExternalObj;
~~~

~~~js
import { PerspectiveCamera } from "three";

function createCamera() {
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 10; // 稍微改一下视野
  return camera;
}

export default createCamera;
~~~

~~~js
import createAmbientLight from "./components/ambientLight";
import createCamera from "./components/camera";
import createDirectionalLight from "./components/directionalLight";
import createExternalObj from "./components/externalObj";
import createHemisphereLight from "./components/hemisphereLight";
import createScene from "./components/scene";
import createControls from "./systems/controls";
import createRenderer from "./systems/renderer";

let scene;
let camera;
let renderer;
let resizer;
let light;
let hemisphereLight;
export default class World {
  constructor(container) {
    scene = createScene();
    camera = createCamera();
    light = createDirectionalLight();
    hemisphereLight = createHemisphereLight();
    scene.add(light);
    scene.add(hemisphereLight);
    renderer = createRenderer(container);
    const controls = createControls(camera, renderer, scene);
  }
  async init() { // +
    const parrot = await createExternalObj("/models/Parrot.glb");
    scene.add(parrot);
  }
  render() {
    renderer.render(scene, camera);
  }
~~~

由于加载是异步的，所以添加一个异步init方法用于加载外部模型，然后再main里使用：

~~~ts
import World from "./world";

async function main() {
  const container = document.querySelector("#scene-container");
  const world = new World(container);
  await world.init(); // +
  world.render();
}

main();
~~~

![](.\images\Snipaste_2025-12-10_08-24-02.jpg)

现在模型加载好了，让我们加载模型动画吧！

在加载之前，我们先介绍几个概念：

- 关键帧轨迹（**KeyframeTrack**）

  我们知道动画是由一个一个帧绘制而成的，而其中关键帧是最主要的，确定了一些关键状态，其他帧只需要平滑的填补（数学计算）关键帧之间的状态，就可以实现一个动画。而所有关键帧所构成的数组，就是所谓关键帧轨迹，在three.js中，关键帧轨迹是这样定义的：

  ~~~ts
  import { NumberKeyframeTrack } from "three";
  
  const times = [0, 1, 2, 3, 4];
  const values = [0, 1, 0, 1, 0];
  
  // .material.opacity取得是mesh.material.opacity，其实就是一个JSONPath
  const opacityKF = new NumberKeyframeTrack(".material.opacity", times, values);
  ~~~

  所有关键帧轨迹类：

  - [`NumberKeyframeTrack`](https://threejs.org/docs/#api/en/animation/tracks/NumberKeyframeTrack)
  - [`VectorKeyframeTrack`](https://threejs.org/docs/#api/en/animation/tracks/VectorKeyframeTrack)
  - [`QuaternionKeyframeTrack`](https://threejs.org/docs/#api/en/animation/tracks/QuaternionKeyframeTrack)
  - [`BooleanKeyframeTrack`](https://threejs.org/docs/#api/en/animation/tracks/BooleanKeyframeTrack)
  - [`StringKeyframeTrack`](https://threejs.org/docs/#api/en/animation/tracks/StringKeyframeTrack)

- 动画剪辑（**AnimationClip**）

  通常，我们对一个物体施加动画，一般不会只有一个关键帧轨迹，比如我们希望某个物体既有旋转平移又有透明变化，单靠一个关键帧轨迹是做不到的，这时候为了把多个关键帧轨迹组合起来，就需要使用动画剪辑：

  ~~~ts
  import { AnimationClip, NumberKeyframeTrack, VectorKeyframeTrack } from "three";
  
  const positionKF = new VectorKeyframeTrack(
    ".position",
    [0, 3, 6],
    [0, 0, 0, 2, 2, 2, 0, 0, 0]
  );
  
  const opacityKF = new NumberKeyframeTrack(
    ".material.opacity",
    [0, 1, 2, 3, 4, 5, 6],
    [0, 1, 0, 1, 0, 1, 0]
  );
  
  const moveBlinkClip = new AnimationClip("move-n-blink", -1, [
    positionKF,
    opacityKF,
  ]);
  ~~~

- 混合器（**AnimationMixer**）与动作（**AnimationAction**）

  有了动画，接下来就是如何将动画和物体关联起来了，这时候就需要使用**混合器**和**动作**。

  ~~~ts
  import { Mesh, AnimationMixer } from 'three';
  
  // create a normal, static mesh
  const mesh = new Mesh();
  // turn it into an animated mesh by connecting it to a mixer
  const mixer = new AnimationMixer(mesh);
  
  const action = mixer.clipAction(moveBlinkClip);
  // immediately set the animation to play
  action.play();
  // later, you can stop the action
  action.stop();
  ~~~

- 动画播放

  看起来我们的工作都结束了，那么这时候动画完成了吗？还没有。

  ~~~ts
  const clock = new Clock();
  
  // 我们需要在每一帧的时候调用mixer.update()才能真正触发动画播放
  const delta = clock.getDelta();
  mixer.update(delta);
  ~~~

有点读者可能会奇怪，既然我们是通过mixer.update进行的播放，为什么还要用action.play呢？我们将这两个功能解耦，mixer.update类似推动时间轴移动，而action.play是指代某个动作是否执行，但是并不是所有动作在时间轴进行推进的时候一直执行，动作总是在某阶段运动然后在某阶段停止，mixer.update并不知道哪些动作需要活动哪些动作需要停止。

动画剪辑很复杂，幸运的是，一般这个是随着glTF一起被导出的，现在我们就给上面的鹦鹉添加上动画吧：

~~~ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimationMixer } from "three";
function setupModel(data) {
  const model = data.scene.children[0];
  const clip = data.animations[0]; // +
  const mixer = new AnimationMixer(model); // +
  mixer.clipAction(clip).play(); // +
  model.tick = (delta) => mixer.update(delta); // +
  return model;
}
async function createExternalObj(src) {
  const loader = new GLTFLoader();
  const externalObjData = await loader.loadAsync(src);
  return setupModel(externalObjData);
}
export default createExternalObj;

~~~

~~~ts
import createAmbientLight from "./components/ambientLight";
import createCamera from "./components/camera";
import createDirectionalLight from "./components/directionalLight";
import createExternalObj from "./components/externalObj";
import createHemisphereLight from "./components/hemisphereLight";
import createScene from "./components/scene";
import createControls from "./systems/controls";
import createRenderer from "./systems/renderer";
import { Loop } from "./systems/loop"; // +

let scene;
let camera;
let renderer;
let resizer;
let light;
let hemisphereLight;
let loop; // +
export default class World {
  constructor(container) {
    scene = createScene();
    camera = createCamera();
    light = createDirectionalLight();
    hemisphereLight = createHemisphereLight();
    scene.add(light);
    scene.add(hemisphereLight);
    renderer = createRenderer(container);
    const controls = createControls(camera, renderer, scene);
    loop = new Loop(camera, scene, renderer); // +
    loop.start(); // +
  }
  async init() {
    const parrot = await createExternalObj("/models/Parrot.glb");
    loop.updatables.push(parrot); // +
    scene.add(parrot);
  }
  render() {
    renderer.render(scene, camera);
  }
}
~~~

![](.\images\parrot.gif)

#### 总结

到这里three.js的基础用法就结束了。

相关代码可以在[github](https://github.com/ounstoppableo/three_js_basic)查看。

### 参考文献

[探索three.js](https://discoverthreejs.com/zh/book/)

