### vue踩坑日记

#### v-show不会触发组件内生命周期

假设我们有一个父组件，父组件中利用v-show控制了子组件的显示隐藏，此时通过v-show引发的变化并不会触发子组件的updated或mounted生命周期，因为它不会改变虚拟dom的结构，而v-if就可以触发mounted生命周期。

其实我们可以想象，假设我们在一个组件内直接获取dom节点并对其进行操作，那么这个操作结果将会在刷新后消失，因为vue的再渲染会覆盖它，vue的视图渲染必须要经过v-dom才能被保存下来。那么v-show也是一样，v-show是通过操作`display: none`来控制元素的显示与隐藏的，而这种控制就类似于直接操作dom的属性，没有经过响应式数据的控制，所以并不会引发生命周期。

#### updated生命周期的危险性

当使用updated生命周期的时候要非常小心，我们来看一个情况：

~~~vue
<template>
	<div>
        {{someRefData}}
    </div>
</template>
<script>
import {ref} from 'vue';
export default {
    setup(){
        const someRefData = ref(0);
        const someEffect = ()=>{
            someRefData.value = Math.random();
            requestAnimationFrame(()=>{
                someRefData.value = Math.random();
            })
        }
        return {
            someRefData,
            someEffect
        }
    },
    mounted(){
      	this.someEffect();
    },
    updated(){
        this.someEffect();
    }
}
</script>
~~~

这样写会产生死循环，因为someRefData的值会一直发生改变，触发页面重新渲染，那么updated也会被触发，于是就进入死循环。

使用nextTick或其他异步函数也是不行的，一定要注意。

除此之外，在updated中变化响应式数据也要非常小心，即使没进行异步变化，如果不好好控制响应式数据的变化条件，也是会进入死循环的。

#### 作用域插槽的块作用域性

我们来看一个情况：

~~~vue
<template>
	<some-component>
        <template #default="scopeData">
            <div>
                {{scopeData}}
   		 	</div>
		</template>
    </some-component>
	<some-component>
		<template #default="scopeData">
            <div>
                <!-- 与第一个scopeData没关系 -->
                {{scopeData}}  
   		 	</div>
		</template>
	</some-component>
</template>
<script>
</script>
~~~

我们可以看见两个作用域插槽都使用了scopeData变量，但实际上scopeData在不同插槽中是互不干扰的，因为作用域插槽有自己的块作用域。

#### deep失效问题

当我们使用deep想修改深层的子标签的样式时，可能会遇到没反应的情况，下面是失效时的场景之一：

~~~vue
<template>
  <el-button> Click Me </el-button>
</template>
<style scoped>
:deep(.el-button) {
  background-color: black;
}
</style>
~~~

下面是未生效的效果：

![](.\images\Snipaste_2024-08-30_16-24-25.png)

我们希望的效果是这样：

![](.\images\Snipaste_2024-08-30_16-26-33.png)

那么原因是什么呢？

在此之前我们先来**看看deep的工作原理**。

##### deep的工作原理

当我们**使用deep时**：

![](.\images\Snipaste_2024-08-30_16-28-28.png)

当我们**不使用deep时**：

![](.\images\Snipaste_2024-08-30_16-57-12.png)

细心的读者可能发现有不一样的地方了：其属性选择器的位置不同了！**所以deep的作用就是改变属性选择器的位置。**

为什么要这样做呢？

在此之前我们需要先了解**scoped的工作原理**。

##### scoped的工作原理

vue为了能区分组件的样式作用域，从而定义了data-v-[hash]的属性，用于唯一区分组件内部的所有样式类。

data-v-[hash]是什么时候会被加上呢？是当我们定义了\<style scoped>\</style>标签并且内部有相应的样式时才会生效，比如：

~~~vue
<!-- app.vue文件 -->
<template>
  <demo></demo>
</template>
<script setup>
import demo from './demo.vue'
</script>
<style scoped>
</style>
~~~

~~~vue
<!-- demo.vue文件 -->
<template>
  <div>
    <div>22222</div>
    <demo2></demo2>
  </div>
</template>
<script setup>
import demo2 from './demo2.vue'
</script>
<style scoped>
</style>
~~~

~~~vue
<!-- demo2.vue文件 -->
<template>
  <div>
    <div>22222</div>
  </div>
</template>
<script setup>
</script>
<style scoped>
</style>
~~~

可以发现我在这几个组件中都添加了带有scoped的style标签，我们来看看它们展示在页面中的结果：

![](.\images\Snipaste_2024-09-02_08-33-27.png)

是不是完全没有看到data-v-[hash]（除了默认的data-v-app）。我们随便添加一个样式（即使这个样式不会选中组件中的任何元素）：

~~~vue
<!-- app.vue文件 -->
<template>
  <demo></demo>
</template>
<script setup>
import demo from './demo.vue'
</script>
<style scoped>
h2 {
  background: black;
}
</style>
~~~

![](.\images\Snipaste_2024-09-02_08-35-38.png)

可以发现终于可以看到data-v-[hash]属性了，但假设我们不使用scoped：

~~~vue
<!-- app.vue文件 -->
<template>
  <demo></demo>
</template>
<script setup>
import demo from './demo.vue'
</script>
<style>
h2 {
  background: black;
}
</style>
~~~

![](.\images\Snipaste_2024-09-02_08-38-15.png)

data-v-[hash]也是不会出现的，那么我们就可以总结data-v-[hash]出现的两个条件：

- style标签带有scoped属性
- style标签内用样式（即使样式没有选中任何元素）

下面我们来探讨一下data-v-[hash]出现的位置，在上面的案例中，data-v-[hash]显然是打在了子组件的根元素上了，我们来看一个情况：

~~~vue
<!-- app.vue文件 -->
<template>
  <demo></demo>
  <div>3333</div>
  <div><div>4444</div></div>
</template>
<script setup>
import demo from './demo.vue'
</script>
<style scoped>
h2 {
  background: black;
}
</style>
~~~

~~~vue
<!-- demo.vue文件 -->
<template>
  <div>
    <div>22222</div>
    <demo2></demo2>
  </div>
  <div>demo5555</div>
</template>
<script setup>
import demo2 from './demo2.vue'
</script>
<style scoped>
</style>
~~~

![](.\images\Snipaste_2024-09-02_08-45-08.png)

我们可以看到，如果子组件的跟组件不是唯一的，那么data-v-[hash]就不会打在任何子组件的跟组件上，而父组件内部所有组件即使是深层的也被打上了data-v-[hash]属性。

所以我们可以总结data-v-[hash]出现的位置：

- 所有父组件下元素（非组件），即使是深层
- 父组件下的子组件其根元素必须只有一个，则根组件能被打上标签（只有根被打，深层的元素是不会被打的），如果是多个根，则都不打

接下来我们在考虑一些特殊情况：

- data-v-[hash]重复打在一个标签上的情况

  如果子组件只有一个根，并且其内部也满足给自己的作用域打上data-v-[hash]的条件，比如：

  ~~~vue
  <!-- app.vue文件 -->
  <template>
    <demo></demo>
  </template>
  <script setup>
  import demo from './demo.vue'
  </script>
  <style scoped>
  h2 {
    background: black;
  }
  </style>
  ~~~

  ~~~vue
  <!-- demo.vue文件 -->
  <template>
    <div>
      <div>22222</div>
      <demo2></demo2>
    </div>
  </template>
  <script setup>
  import demo2 from './demo2.vue'
  </script>
  <style scoped>
  h1 {
    background: black;
  }
  </style>
  ~~~

  ![](.\images\Snipaste_2024-09-02_08-50-30.png)

- 插槽的情况

  ~~~vue
  <!-- app.vue文件 -->
  <template>
    <demo><div>我是插槽</div></demo>
  </template>
  <script setup>
  import demo from './demo.vue'
  </script>
  <style scoped>
  h2 {
    background: black;
  }
  </style>
  ~~~

  ~~~vue
  <!-- demo.vue文件 -->
  <template>
    <div>
      <div>22222</div>
      <demo2></demo2>
      <slot></slot>
    </div>
  </template>
  <script setup>
  import demo2 from './demo2.vue'
  </script>
  <style scoped>
  h1 {
    background: black;
  }
  </style>
  ~~~

  ![](.\images\Snipaste_2024-09-02_08-54-18.png)

  可以发现插槽被打上的是父组件下的data-v-[hash]，也就是说插槽的样式是通过父组件定义的。

到目前为止我们已经弄清楚scoped的大部分情况了，然后我们在反过来看下面这个图：

![](.\images\Snipaste_2024-08-30_16-57-12.png)

这是没有使用deep时属性选择器的位置，可以发现通过这样的写法是不是能够选中某个作用域下的标签而不会影响其他标签。**以上就是scoped的原理。**

> 比如类选择器：.a.b选择的是既有a类又有b类的元素，而.a .b是选择a类为父类b类为子类的子类元素，而.el-bottom[data-b-7ba5db90]与.a.b同理

##### 回到正题

看完了上面的各种原理，我们可以发现一个问题，也就是在下列例子：

![](.\images\Snipaste_2024-08-30_16-57-12.png)

这个例子中不使用deep的样式貌似可以生效啊！实际上确实生效了，这应该是一个bug，**也就是父组件能定义子组件最外层元素的样式**。但是更深层显然就不能通过这个方法去获取了，可以**参考上面的scoped原理**。

而此时deep的作用就出现了，我们来看一个例子：

~~~vue
<template>
  <el-input></el-input>
</template>
<style scoped>
:deep(.el-input__wrapper) {
  background-color: black;
}
</style>
~~~

![](.\images\Snipaste_2024-08-30_16-51-27.png)

deep只是稍微改变了一下属性选择器的位置，就可以选择到我们想要的元素了。

现在我们来解决一下开头提到的问题：

~~~vue
<template>
  <el-button> Click Me </el-button>
</template>
<style scoped>
:deep(.el-button) {
  background-color: black;
}
</style>
~~~

这样定义样式写不到外层元素上，其实看看我给出的图片就知道了，它是这样选择的：

~~~css
[data-v-7ba5bd90] .el-button {
  background-color: black;
}
~~~

因为我们打data-v-[hash]标签与.el-button是在同一个标签上，所以不能使用子类选择器，而不使用deep反而就能选择到了。但是我们也可以选择在外层套一层div，让data-v-[hash]打到该div上，.el-button就可以作为子类被选到了，比如：

~~~vue
<template>
  <div>
    <el-button> Click Me </el-button>
  </div>
</template>
<style scoped>
:deep(.el-button) {
  background-color: black;
}
</style>
~~~

以上就是deep的解决方法，实际上现实远远没有那么简单，我就遇到过v-data-[hash]被打飞了，怎么也打不到根元素上，导致样式布置不了，所以诸位在使用deep时还是需要小心。

#### defineAsyncComponent性能优化

我们通过mounted生命周期去渲染一些真实dom的时候会遇到页面卡顿的情况，比如我通过echarts去渲染50个图表，我们知道这个操作一般都是在vue的模板中创建一个容器，然后echarts通过id获取容器然后去操作真实dom，这时候就会出现页面卡顿的情况，即使使用v-if去延迟渲染也没有效果。

**原因**：那是因为引入的组件会存在一个初始化的过程，即使是使用了v-if也会被初始化，也只就会被mount，这时mount生命周期就会被执行，然后就会渲染chart造成页面卡顿。

**解决方法**：通过使用defineAsyncComponent去按需引入。

#### 响应式初始化的值为另一个响应式的问题

我们看一个例子：

~~~vue
<script setup>
import { ref, reactive, watch } from "vue";
const a = ref(1);
const b = reactive({ a: a.value });
watch(
  () => b.a,
  (newVal) => {
    console.log(newVal);
  },
  {
    deep: true,
  }
);
const handleClick = () => {
  a.value++;
};
</script>

<template>
  <button @click="handleClick">+1</button>
  <div>{{ a }}</div>
</template>
~~~

我们定义了一个响应式a，然后将a的值作为b的初始化的值，此时如果改变a的值，b是否也会根据a的变化而变化？

我们在这里使用了watch来监听b的变化，但是遗憾的是**a的变化并不会引起b的变化**。

