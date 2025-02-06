## 导读

本文内容属于vue3源码阅读合集的一个章节，vue3源码阅读包含了从响应式原理到虚拟dom原理等一系列内容，能帮助读者深入的理解vue3的工作原理，对入门和进阶前端技术都会有所帮助。

[点我去到vue3源码阅读导览页面~~](https://www.unstoppable840.cn/article/9e093c80-4af6-49c0-b9fe-09f393051006)

## vue虚拟dom原理解析

> 在阅读源码的时候，很多朋友不知道如何下手，其实最好的一个方法就是结果导向法，通过先去观察结果，再一步步回推过程，这样能够迅速帮助理解源码。

### createApp原理

createApp是整个vue项目的核心，所谓万丈高楼平地起，要深入了解vue虚拟dom的原理，我们最好的方法是先弄清楚createApp的底层实现逻辑，然后再一步步去分析比较具体的，某个组件、某个虚拟dom的模式，从抽象到具体，这也是遵循了我们软件开发的依赖倒转原则。

> 之后贴的代码我都将进行简化

首先看看createApp的代码：

~~~ts
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)

  const { mount } = app
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) return

    const component = app._component
    if (!isFunction(component) && !component.render && !component.template) {
      // __UNSAFE__
      // Reason: potential execution of JS expressions in in-DOM template.
      // The user must make sure the in-DOM template is trusted. If it's
      // rendered by the server, the template should not contain any user data.
      component.template = container.innerHTML
      // 2.x compat check
      if (__COMPAT__ && __DEV__) {
        for (let i = 0; i < container.attributes.length; i++) {
          const attr = container.attributes[i]
          if (attr.name !== 'v-cloak' && /^(v-|:|@)/.test(attr.name)) {
            compatUtils.warnDeprecation(
              DeprecationTypes.GLOBAL_MOUNT_CONTAINER,
              null,
            )
            break
          }
        }
      }
    }

    // clear content before mounting
    container.innerHTML = ''
    const proxy = mount(container, false, resolveRootNamespace(container))
    if (container instanceof Element) {
      container.removeAttribute('v-cloak')
      container.setAttribute('data-v-app', '')
    }
    return proxy
  }

  return app
}) as CreateAppFunction<Element>
~~~

上面的createApp代码做了两件事：

- 一个是利用一个代理的createApp创建了app；
- 二是重写mount方法，不过也只是多加了一点逻辑，本质还是调用了原有的mount方法。

这就创建了一个vue的项目实例，在我们的项目中，只要mount上具体的dom节点，我们就可以在页面中渲染出vue项目了。但是app的功能还不只有mount，它还有use、component、directive、provide、mixin等方法，用于全局的注册某个东西，以便我们的子组件能够使用。那么这些方法又是什么时候植入的呢？

显然是通过createApp代码所做的第一件事，使用了一个代理createApp。这个createApp是()返回的某个对象内部的某个方法，我们现在就来看看这个ensureRenderer()返回的到底是什么：

~~~ts
function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
  )
}
~~~

可以发现ensureRenderer是一个单例工厂，它返回一个渲染器的单例，如果已经创建过渲染器就不再进行创建了，也就是说不管创建多少个vue实例，发生作用的都只有一个渲染器。而createRenderer方法内容如下：

~~~ts
export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement,
>(options: RendererOptions<HostNode, HostElement>) {
  return baseCreateRenderer<HostNode, HostElement>(options)
}
~~~

~~~ts
function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions,
): any {
  // ...
      
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate),
  }  
}
~~~

~~~ts
export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
  hydrate?: RootHydrateFunction,
): CreateAppFunction<HostElement> {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = extend({}, rootComponent)
    }

    if (rootProps != null && !isObject(rootProps)) {
      __DEV__ && warn(`root props passed to app.mount() must be an object.`)
      rootProps = null
    }

    const context = createAppContext()
    const installedPlugins = new WeakSet()

    let isMounted = false

    const app: App = (context.app = {
      _uid: uid++,
      _component: rootComponent as ConcreteComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,

      version,

      get config() {
      },

      set config(v) {
      },

      use(plugin: Plugin, ...options: any[]) {
      },

      mixin(mixin: ComponentOptions) {
      },

      component(name: string, component?: Component): any {
      },

      directive(name: string, directive?: Directive) {
      },

      mount(
        rootContainer: HostElement,
        isHydrate?: boolean,
        namespace?: boolean | ElementNamespace,
      ): any {
      },

      unmount() {
      },

      provide(key, value) {
      },

      runWithContext(fn) {
      },
    })
    return app
  }
}
~~~

是不是感觉一切都明朗了起来，renderer原来干的就是这些事！app里拥有的那些方法也找到了出处。但是具体这些方法的实现手法在这里就不提了，后续如果博主会写相应的模块的文章或许会再进行介绍。

现在我们已经知道一个vue实例是如何产出的了，但是我们对于其如何对组件进行渲染还是十分困惑：

~~~ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App).mount('#root')
~~~

怎么createApp然后mount就能进行渲染了呢？而对这个问题进行解读就是本篇文章的重头戏。

> #### 小知识
>
> 在我们的印象中，createApp只会在main函数里调用一次，然后之后就不会再使用到这个函数了，实际上这个函数还有别的作用——将虚拟dom转换为真实dom。
>
> 在vue的源码中，将虚拟dom转换为真实dom都是通过patch代理实现的，然而vue并没有暴露出patch这个函数给我们使用，所以我们只能另辟蹊径，也就是使用createApp。
>
> 那么应该怎么使用呢？
>
> ~~~vue
> <template>
> 	<div ref="demo">
>         
>     </div>
> </template>
> <script setup>
> 	import { ref,createApp,onMounted,onUnmounted } from 'vue';
> 	const demo = ref(null);
>     const demoApp = ref();
> 	onMounted(()=>{
>     	demoApp.value = createApp({render:()=>h('div','一些内容')});
>     	demoApp.value.mount(demo.value);
> 	})
>     // 在某些刷新操作前使用unmount很重要，不然会出现一些意想不到的错误
> 	onUnmounted(()=>{
>         demoApp.value.unmount();
>     })
> </script>
> ~~~
>
> 那么虚拟dom转真实dom的场景有哪些呢？
>
> - 比如我们想在render函数以外的地方使用h函数时，我们知道选项式配置可以自定义render函数，而h一般的使用场景好像也就是这里，但是如果使用createApp，我们就可以将其用于任何地方。其实就类似与JSX的使用方式。
>
> 一些注意事项：
>
> - 有人会觉得使用createApp心里没底，可能会造成内存增加或者其他一些问题。createApp确实**不到万不得已还是少用**，因为其确实存在一些问题，但内存问题其实并没有那么严重，读者可以往下看看createApp的内部结构，实际上比一个虚拟dom也大不到哪去。
>
> - 实际上我们有其他替代方式，也就是动态组件\<component :is=xxx>\</component>
>
>   ~~~vue
>   <component :is="h('div', '一些内容')"></component>
>   ~~~

#### 组件是如何渲染的

我们回顾一下vue的结构，是不是类似一种树型，app下面有很多根组件，根组件下面也可能有很多次根组件，总而言之就是形成一种树状，而不论如何app却只有一个，其不为别的，就是方便被createApp(App)解析。

我们看看App这个参数位的含义：

~~~ts
export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
  hydrate?: RootHydrateFunction,
): CreateAppFunction<HostElement> {
  return function createApp(rootComponent, rootProps = null) {}
}
~~~

发现它是作为rootComponent被传入的，而这个rootComponent再被传入之后究竟经过了怎样的加工，最后竟然能被渲染在页面上？

首先最重要的就是mount了，如果不进行mount页面是不会被渲染的，所以我们来看看mount的逻辑：

~~~ts
export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
  hydrate?: RootHydrateFunction,
): CreateAppFunction<HostElement> {
  return function createApp(rootComponent, rootProps = null) {

    // ...
    let isMounted = false
    const app: App = (context.app = {
      // ...
      mount(
        rootContainer: HostElement,
        isHydrate?: boolean,
        namespace?: boolean | ElementNamespace,
      ): any {
          if (!isMounted) {
            // 将APP组件转变为虚拟节点（什么是虚拟节点后续会介绍）
          	const vnode = createVNode(rootComponent, rootProps)
            // 创建上下文
          	vnode.appContext = context
		
            // hydrate是ssr中的逻辑，我们完全可以不理会，但是为了防止引起一些不必要的争议，这里就不把这个逻辑删除了
          	if (isHydrate && hydrate) {
          	  hydrate(vnode as VNode<Node, Element>, rootContainer as any)
          	} else {
              // 核心逻辑
          	  render(vnode, rootContainer, namespace)
          	}
          	isMounted = true
            // 咱们区分一下rootContainer和rootComponent，rootComponent是app组件，rootContainer是挂载的目标dom
          	app._container = rootContainer
          	;(rootContainer as any).__vue_app__ = app
            // 返回组件实例，之后会介绍，我们在实际项目开发中也有用到
          	return getComponentPublicInstance(vnode.component!)
        }
      },
    })
    return app
  }
}
~~~

看了上面一段代码之后，我们知道组件渲染的核心逻辑在于render()函数，它是作为baseCreateRenderer内部的一个函数传递给createAppAPI的，现在我们就来看看它的具体实现：

~~~ts
// namespace可以忽略一下
const render: RootRenderFunction = (vnode, container, namespace) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true)
      }
    } else {
      patch(
        container._vnode || null,
        vnode,
        container,
        null,
        null,
        null,
        namespace,
      )
    }
    
    if (!isFlushing) {
      isFlushing = true
      flushPreFlushCbs()
      flushPostFlushCbs()
      isFlushing = false
    }
    container._vnode = vnode
}
~~~

其中最核心的逻辑就是patch函数，而我们常听的vue的优化算法（diff算法）也是patch函数内部的逻辑。

现在我们还是先不急着去阅读patch源码，读到这里相信大家对组件的渲染或者说根组件的渲染有了一定的认识，实际上组件集就是一棵树，所有组件的渲染都是通过patch完成的，就像老生常谈的一样，patch会去对比每个组件是否变化（也提高了hmr的效率），然后进行虚到实的转变。但是具体到某个组件变化时（响应式时），patch完全可以只选择对某个组件进行扫码，而不必对组件树进行整体扫描，这也提高了渲染效率，具体过程会在后续进行介绍。

### 虚拟节点（vnode）

> vnode实际上就是虚拟dom的节点单元

前面我们讲了createApp创建vue实例并且进行组件渲染的具体过程，其中先使用到createVNode()函数创建vnode，才能进行后续的渲染，那么这个vnode是什么呢？

vnode可以说是vue中最核心的概念，它贯穿了vue的始终，并且也贯穿了所有基于虚拟dom技术的框架，所以弄清楚vnode可以说是非常必要的。

#### vnode的创建

下面我们看看createVNode的源码：

~~~ts
function _createVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  isBlockNode = false,
): VNode {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    type = Comment
  }

  // 如果已经是vnode，则直接返回clone的vnode
  if (isVNode(type)) {
    const cloned = cloneVNode(type, props, true /* mergeRef: true */)
    if (children) {
      normalizeChildren(cloned, children)
    }
    if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
      if (cloned.shapeFlag & ShapeFlags.COMPONENT) {
        currentBlock[currentBlock.indexOf(type)] = cloned
      } else {
        currentBlock.push(cloned)
      }
    }
    cloned.patchFlag = PatchFlags.BAIL
    return cloned
  }

  // class和style的处理
  if (props) {
    // for reactive or proxy objects, we need to clone it to enable mutation.
    props = guardReactiveProps(props)!
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
    if (isObject(style)) {
      // reactive state objects need to be cloned since they are likely to be
      // mutated
      if (isProxy(style) && !isArray(style)) {
        style = extend({}, style)
      }
      props.style = normalizeStyle(style)
    }
  }

  // encode the vnode type information into a bitmap
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : __FEATURE_SUSPENSE__ && isSuspense(type)
      ? ShapeFlags.SUSPENSE
      : isTeleport(type)
        ? ShapeFlags.TELEPORT
        : isObject(type)
          ? ShapeFlags.STATEFUL_COMPONENT
          : isFunction(type)
            ? ShapeFlags.FUNCTIONAL_COMPONENT
            : 0

  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true,
  )
}
~~~

~~~ts
function createBaseVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag = 0,
  dynamicProps: string[] | null = null,
  shapeFlag = type === Fragment ? 0 : ShapeFlags.ELEMENT,
  isBlockNode = false,
  needFullChildrenNormalization = false,
) {
  // vnode的属性列表，是不是看得有点头疼😢
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance,
  } as VNode

  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children)
    // normalize suspense children
    if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
      ;(type as typeof SuspenseImpl).normalize(vnode)
    }
  } else if (children) {
    // compiled element vnode - if children is passed, only possible types are
    // string or Array.
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }

  return vnode
}
~~~

**这两段代码我们只需要记住vnode的结构就行了**。

vnode的结构：

~~~ts
const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance,
} as VNode
~~~

看到createVnode大家可能都觉得很陌生，但是提到h()相信大家都会很熟悉，实际上h()就是对createVnode进行了一个封装：

~~~ts
export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  const l = arguments.length
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // single vnode without props
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      // props without children
      return createVNode(type, propsOrChildren)
    } else {
      // omit props
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}

~~~

也就是h()简化了一个虚拟node的创建。

#### vnode的类型

vnode类型主要有四种：

- 元素节点 (Element Node):

  表示常规的 HTML 元素，例如 `<div>`, `<span>` 等

  `h()` 函数用于创建元素节点

- 文本节点 (Text Node):

  表示纯文本内容。这些节点不包含子节点或属性，只包含文本内容

  `createTextVNode()` 函数用于创建文本节点

- 注释节点 (Comment Node):

  表示 HTML 注释节点，通常在开发模式下有用，用于调试和理解渲染树

  `createCommentVNode()` 函数用于创建注释节点

- 静态节点 (Static Node):

  表示不随数据变化的静态内容，可以在编译阶段优化，从而避免在每次渲染时重新计算。

### patch

前面我们讲了组件的渲染，虚拟节点，但是一切的一切都只是以自定的对象的形式在呈现，最终如何通过这个对象将其转变为真实的能够表现在网页中的图像呢（说的过火了，实际上就是变为真实dom节点）？那就需要用到patch函数了。

可以说patch函数就是vue的核心逻辑之一（响应式也是）。

patch的主要逻辑包括：

- diff优化
- 虚拟dom转换为真实dom

#### 源码解析

在源码解析之前，我们需要先了解vue对创建真实dom的操作进行了封装，它将这些操作放在nodeOps中，然后又作为rendererOptions传给了createRenderer，createRenderer又对这些操作进行了重命名（添加了host前缀），在阅读源码解析之前可以浏览一下这些封装操作，也可以边阅读边看：

~~~ts
export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },

  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  createElement: (tag, namespace, is, props): Element => {
    const el =
      namespace === 'svg'
        ? doc.createElementNS(svgNS, tag)
        : namespace === 'mathml'
          ? doc.createElementNS(mathmlNS, tag)
          : is
            ? doc.createElement(tag, { is })
            : doc.createElement(tag)

    if (tag === 'select' && props && props.multiple != null) {
      ;(el as HTMLSelectElement).setAttribute('multiple', props.multiple)
    }

    return el
  },

  createText: text => doc.createTextNode(text),

  createComment: text => doc.createComment(text),

  setText: (node, text) => {
    node.nodeValue = text
  },

  setElementText: (el, text) => {
    el.textContent = text
  },

  parentNode: node => node.parentNode as Element | null,

  nextSibling: node => node.nextSibling,

  querySelector: selector => doc.querySelector(selector),

  setScopeId(el, id) {
    el.setAttribute(id, '')
  },

  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, namespace, start, end) {
    // <parent> before | first ... last | anchor </parent>
    const before = anchor ? anchor.previousSibling : parent.lastChild
    // #5308 can only take cached path if:
    // - has a single root node
    // - nextSibling info is still available
    if (start && (start === end || start.nextSibling)) {
      // cached
      while (true) {
        parent.insertBefore(start!.cloneNode(true), anchor)
        if (start === end || !(start = start!.nextSibling)) break
      }
    } else {
      // fresh insert
      templateContainer.innerHTML =
        namespace === 'svg'
          ? `<svg>${content}</svg>`
          : namespace === 'mathml'
            ? `<math>${content}</math>`
            : content

      // 必须提取出content，否则不能添加到页面中
      const template = templateContainer.content
      if (namespace === 'svg' || namespace === 'mathml') {
        // remove outer svg/math wrapper
        const wrapper = template.firstChild!
        while (wrapper.firstChild) {
          template.appendChild(wrapper.firstChild)
        }
        template.removeChild(wrapper)
      }
      parent.insertBefore(template, anchor)
    }
    return [
      // first
      before ? before.nextSibling! : parent.firstChild!,
      // last
      anchor ? anchor.previousSibling! : parent.lastChild!,
    ]
  },
}
~~~

因为具体的patch过程其涉及的代码实在是太多了，所以之后的内容我会使用一个执行图来进行概括，而不去具体解释代码了。但是又为了让读者理解vue具体是怎么实现从vnode到真实dom转变这个过程，我将会列举两个比较简单的例子：text、comment来对这个过程进行一个简单的描述，实际上这个操作使用的就是上面的nodeOps代码中定义的接口，只是vue又多进行了一层封装（加了host前缀），然后也会先给出一个总的patch代码，让读者能够对patch的门面有所认识。

~~~ts
const patch: PatchFn = (
    n1,  // 老节点
    n2,  // 新节点
    container,
    anchor = null,
    parentComponent = null,
    parentSuspense = null,
    namespace = undefined,
    slotScopeIds = null,
    optimized = __DEV__ && isHmrUpdating ? false : !!n2.dynamicChildren,
  ) => {
    // 新老节点相等，不处理
    if (n1 === n2) {
      return
    }

    // 不相等，并且类型也不同，则完全替换
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1)
      unmount(n1, parentComponent, parentSuspense, true)
      n1 = null
    }

    // 
    if (n2.patchFlag === PatchFlags.BAIL) {
      optimized = false
      n2.dynamicChildren = null
    }

    const { type, ref, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      case Comment:
        processCommentNode(n1, n2, container, anchor)
        break
      case Static:
        // 静态的时候一般n2和n1都是一样的，除了n1不存在的情况需要进行插入
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, namespace)
        }
        break
      case Fragment:
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized,
        )
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
          )
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
          )
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          ;(type as typeof TeleportImpl).process(
            n1 as TeleportVNode,
            n2 as TeleportVNode,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals,
          )
        } else if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
          ;(type as typeof SuspenseImpl).process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals,
          )
        }
    }

    // set ref
    if (ref != null && parentComponent) {
      setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2)
    }
  }
~~~

##### processText

~~~ts
const processText: ProcessTextOrCommentFn = (n1, n2, container, anchor) => {
   // n1不存在则直接插入n2
   if (n1 == null) {
     hostInsert(
       // 文本节点的children就是文本内容
       (n2.el = hostCreateText(n2.children as string)),
       container,
       anchor,
     )
   // 存在则只改变内容
   } else {
     const el = (n2.el = n1.el!)
     if (n2.children !== n1.children) {
       hostSetText(el, n2.children as string)
     }
   }
}
~~~

##### processCommentNode

~~~ts
const processCommentNode: ProcessTextOrCommentFn = (
   n1,
   n2,
   container,
   anchor,
 ) => {
   // n1不存在则直接插入n2
   if (n1 == null) {
     hostInsert(
       (n2.el = hostCreateComment((n2.children as string) || '')),
       container,
       anchor,
     )
   // 存在则直接替换
   } else {
     // there's no support for dynamic comments
     n2.el = n1.el
   }
}
~~~

看了上面的代码相信大家对patch代码以及其如何将vnode转换成真实dom有了一定的了解，下面将是执行流程图：

![](.\image\patch流程图.png)

##### processElement与processComponent

在patch中，核心的逻辑就是processElement和processComponent了，其他的如comment、static、text的逻辑十分简单，而suspense、teleport又存在复用processElement的逻辑，所以下面主要是针对processElement、processComponent的逻辑进行阐述。

processElement:

![](.\image\processElement.png)

processElement由图可知其主要更新逻辑是`n1!==null`的时候，其中dynamicChildren主要关注的是一些动态子项，比如v-if、v-show、v-for等生成的元素，因为其复用了patch所以不是主要分析分支。而patchKeyedChildren和patchUnkeyedChildren是diff的实现逻辑，是主要分析内容，会在下一小节具体分析。

processComponent:

![](.\image\processComponent.png)

可以发现图中需要特别了解的函数主要有componentUpdateFn、shouldUpdateComponent、move，move可以看成是对insert进行了一个封装，逻辑不复杂，这里就不再赘述，而shouldUpdateComponent实际上就是监听props、子组件是否发生变化，发生就更新，逻辑也不复杂。其实主要的更新逻辑和processElement一样，也是`n1!==null`的时候，不该更新的时候就把元素（el）复制一遍就好了，应该更新则执行instance.update()，这个函数的主要作用在图中没有画全，它内部也是执行了componentUpdateFn，所以接下来我们看看componentUpdateFn。

componentUpdateFn:

![](.\image\componentUpdateFn.png)



我们可以发现其实componentUpdateFn的主要作用就是修改了instance.subTree，并且递归使用patch去处理子组件。我们可以将组件的渲染想象成一棵树，树的根是组件虚拟dom，他的子节点就会有Element的虚拟dom，也会有其他组件虚拟dom，Element的虚拟dom会通过processElement转换成真实dom，而组件虚拟dom则不断递归生成Element的虚拟dom后再转换成真实dom，具体实现可以阅读`组件是如何转换成真实dom`章节，而subTree就是组件虚拟dom patch遍历的入口，如上图所示一样。

##### patchKeyedChildren（diff算法）

现在来进入我们的重头戏，diff算法吧！

因为是算法，所以我们就不画流程图了，让我们更专注于算法的作用上：

首先我们知道，diff肯定是有两个输入，我们将这两个输入命名为`prev`和`next`，而这两个都是**数组**的形式，因为不是数组已经在进入patchKeyedChildren前就被处理了。

我们先预设一些变量：

> i = 0 用于记录最早不相同节点的坐标
>
> e1 = prev.length - 1 
>
> e2 = next.length - 1

diff流程有5个步骤，这五个步骤是同步（sync）、顺序执行的：

- 从start开始对比，选出不同位置的下标：

  > 假设：
  >
  > (a b) c
  > (a b) d e
  >
  > 每走一步 i ++
  >
  > 并且每走一步都直接`更新`

- 从end开始对比

  > 假设：
  >
  >  a (b c)
  >
  >  d e (b c)
  >
  > 每走一步 e1-- 和 e2 --
  >
  > 并且每走一步都直接`更新`

- 如果前两个对比完后，刚好`prev`为`next`的子项时，也就是：`i>e1`且`i<=e2`

  > (a b)
  >
  > (a b) c
  >
  > i = 2, e1 = 1, e2= 2 
  >
  > (a b)
  >
  > c (a b)
  >
  > i = 0,  e1 = -1, e2 = 0
  >
  > 直接`添加`next的节点

- 如果前两个对比完后，刚好`next`为`prev`的子项时，也就是：`i<=e1`且`i>e2`

  > (a b) c
  >
  > (a b)
  >
  > i = 2, e1 = 2, e2 = 1
  >
  >  a (b c)
  >
  > (b c)
  >
  > i = 0, e1 = 0, e2 = -1
  >
  > 直接`删除`prev的节点

- 之后就是没有那么好运的情况了，比如：

  > \[i ... prev.length + 1]: a b [c d e] f g
  >
  > \[i ...  next.length + 1]: a b [e d c h] f g
  >
  > i = 2, e1 = 4, e2 = 5

  那怎么办呢？

  - 首先预设一些变量

    >  s1 = i  --  prev未操作序列的开始位置
    >
    >  s2 = i  --  next未操作序列的开始位置
    >
    > keyToNewIndexMap = new Map()  --  对next建立一个key与index的：Map<PropertyKey, number>
    >
    > newIndexToOldIndexMap = new Array(next.length - s2 + 1)并初始化为0  --  用于记录next中的哪些节点在旧节点序列中存在

  - 遍历prev未操作序列，设 i 为索引

    - 查看prev里拥有key的节点是否在next中出现（直接对比key，效率高），通过keyToNewIndexMap找到其出现的下标设为newIndex；

      对于没有key的prev节点则通过全量比较（isSameVNodeType），查看其是否存在于next中，会比较消耗资源，找到其出现的下标设为newIndex

    - 如果不存在则`删除`该节点；

      如果存在则`更新`，并且更新newIndexToOldIndexMap[newIndex - s2] = i + 1（这里是i+1的原因主要是避免0下标的情况，值加多少本身不会对结果有影响，可参考下面步骤），并记录此节点需要被移动（判断新节点下标是否大于等于迄今为止最大的新节点下标，如果满足则刷新迄今为止最大的节点，否则记录为需要移动，简单来说：**如果新节点下标违反递增顺序则需要被移动**）

    - 如果还没遍历完prev，但是更新过的节点数已经大于next的未操作节点数了，此时就将还没遍历的prev未操作节点全删除

  - 做完上述循环之后，我们只是更新了prev中的节点信息，但是位置并没有和next保持一致，下面就来移动prev的位置（到此步骤我们已经能确保prev中不存在next中没有的节点了，也就是已经删完多余节点了）

  - 根据newIndexToOldIndexMap构建一个**以索引为值的**最长递增子序列（比如对于[2,3,4,1]，那么创建最长递增子序列为[0,1,2]）

  - 逆向遍历next未操作序列，设 i 为索引

    - 如果newIndexToOldIndexMap[i]为0，说明此位置没有prev的节点被更新（next的该节点为全新添加），直接`插入`next[s2 + i]（也就是next未操作序列中处于 i 的节点）
    - 如果newIndexToOldIndexMap[i]不为0，说明此位置有prev的节点被更新，此时执行`move`操作（判断 i 是否在递增子序列，在则不动，不在则执行`move`）。

  > 在上面的逻辑中，有个最长递增子序列的问题，为什么要按照最长递增子序列来进行判断呢？
  >
  > 我们可以想象 a b d c e f 和 b d c e f a这个情况：
  >
  > 我们知道b c d e f是最长递增子序列，如果我们不进行这个判断，那么每读到一个newIndexToOldIndexMap[i]不为0，都进行move，那么这种情况我们需要移动n次，而使用最长递增子序列就只需要移动 1 次。

  > 其中move操作实际上就是insertBefore操作，插入到anchor之前的位置。**注意**：大家一定要弄清楚原生insertBefore的功能，如果给定的节点已经存在于文档中，`insertBefore()` 会将其从当前位置移动到新位置。一开始我以为insertBefore只有插入功能，所以在这一块浪费了很长时间，没想到它还有删除功能。。

  > 以上所涉及的操作有`更新`、`添加`、`删除`、`move`，其中`更新`、`添加`都是利用patch递归来实现的。

关于前四步的逻辑很简单，这里就不画图表示了，下面将给出第五步的图示：

![](.\image\Snipaste_2024-11-18_13-52-31.jpg)

我们以上图为例子，执行以下第五步骤。

- 首先预设变量的构建：

  ![](.\image\Snipaste_2024-11-18_14-00-23.jpg)

- 遍历prev，修改newIndexToOldIndexMap：

  ![](.\image\Snipaste_2024-11-18_14-11-45.jpg)

- 创建索引最长递增子序列

  最长递增子序列为[2,3,4,5,6]，其索引为[0,1,2,5,6]，令j = [0,1,2,5,6].length = 5

- move操作，其中anchor为next[s2 + i + 1]

  ![](.\image\Snipaste_2024-11-18_14-17-33.jpg)

  此时到f的i为6，存在于递增子序列，不变：

  ![](.\image\Snipaste_2024-11-18_14-20-30.jpg)

  此时到e的i为5，存在于递增子序列，不变：

  ![](.\image\Snipaste_2024-11-18_14-22-31.jpg)

  此时到g的i为4，不存在于递增子序列，move且j --：

  ![](.\image\Snipaste_2024-11-18_14-32-21.jpg)

  此时可以看到anchor指向e，我们执行`prev.insertBefore(g,e)`，也就是把g放到e前面：

  ![](.\image\Snipaste_2024-11-18_14-34-29.jpg)

  此时到a的i为3，不存在于最长递增子序列，move且j --：

  ![](.\image\Snipaste_2024-11-18_14-37-10.jpg)

  此时可以看到anchor指向g，我们执行`prev.insertBefore(a,g)`，也就是把a放到g前面：

  ![](.\image\Snipaste_2024-11-18_14-38-36.jpg)

  然后剩下的都在递增子序列，这里就不一一演示了：

  ![](.\image\Snipaste_2024-11-18_14-39-34.jpg)

##### patchUnkeyedChildren

patchUnkeyedChildren的代码不难，我们直接看代码吧：

~~~ts
const patchUnkeyedChildren = (
    c1: VNode[],
    c2: VNodeArrayChildren,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInternalInstance | null,
    parentSuspense: SuspenseBoundary | null,
    namespace: ElementNamespace,
    slotScopeIds: string[] | null,
    optimized: boolean,
  ) => {
    c1 = c1 || EMPTY_ARR
    c2 = c2 || EMPTY_ARR
    const oldLength = c1.length
    const newLength = c2.length
    const commonLength = Math.min(oldLength, newLength)
    let i
    // 一一替换
    for (i = 0; i < commonLength; i++) {
      const nextChild = (c2[i] = optimized
        ? cloneIfMounted(c2[i] as VNode)
        : normalizeVNode(c2[i]))
      patch(
        c1[i],
        nextChild,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
      )
    }
    // 老的多删老的
    if (oldLength > newLength) {
      // remove old
      unmountChildren(
        c1,
        parentComponent,
        parentSuspense,
        true,
        false,
        commonLength,
      )
    // 新的多插入新的
    } else {
      // mount new
      mountChildren(
        c2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
        commonLength,
      )
    }
  }
~~~

patchUnkeyedChildren就很粗暴，这里我们可以看到主要是在commonLength这效率会很低，因为它会将每个节点都直接替换掉。

##### 小结

很多读者可能很难看懂上面的逻辑，而博主也确实有的地方处理的不太好，所以在理解性上可能会存在一定的不足，一个**最佳实践**就是：**结合源代码去阅读**。

### 组件是如何转换成真实dom的

从processElement中我们可以知道，vnode可以通过createElement转换成真实dom，其实组件也是借助了processElement生成的真实dom，组件的基本组成单元就是element vnode，只是其多了一个组件vnode这样的抽象进行代理，所以看起来才比较隐晦。组件vnode的结构可以参考下图：



![](.\image\Snipaste_2024-11-18_16-12-59.jpg)

组件的结构类似这样，但是其实其中有一个小错误，那就是子节点不应该直接连接到组件，而应该是这样：

![](.\image\Snipaste_2024-11-18_16-22-16.jpg)

其实就对应于vue不允许多根存在template中，不过现在已经通过fragment解决了这个问题，但是这里不谈，引出上图的模式也是为了让组件vnode的结构更直观，组件vnode实际上就是一个抽象，我们完全可以把其忽略，而只去读取element vnode，比如：

![](.\image\Snipaste_2024-11-18_16-23-12.jpg)

但是我们需要封装一系列props、directives、hooks所以才利用组件vnode来代理封装。

因为我们已经知道element vnode转换到真实dom的方法了，所以现在主要的问题是：

> component是如何生成vnode的?

我们知道component有几种定义形式：

- 通过.vue文件定义
- 通过defineComponent定义

但是.vue文件实际上通过构建工具编译之后也就成了defineComponent，所以component的定义本质上还是defineComponent。

不过defineComponent实际上也没有做什么，主要还是defineComponent中定义的render函数干了一些事，没错，我们在processComponent的解析中有提到，组件的更新逻辑componentUpdateFn中，其通过patch(prevTree,nextTree)进行更新，而其中nextTree是利用renderComponentRoot生成的vnode。所以我们可以确定组件的vnode就是在renderComponentRoot中生成的，实际上其内部调用了一个render函数，看看它的实现：

~~~js
export function renderComponentRoot(...){
	// ...
	
	let result = normalizeVNode(
        render!.call(
          thisProxy,
          proxyToUse!,
          renderCache,
          __DEV__ ? shallowReadonly(props) : props,
          setupState,
          data,
          ctx,
        ),
      )
	
	// ...
	
	return result
}
~~~

而这个render函数就是我们所定义的render函数，比如：

~~~js
const App = Vue.defineComponent((props) => {
     const count = Vue.ref(0)
     return () => {
         // 渲染函数或 JSX
         return Vue.h('div', 'hello')
     }
     },
     {
         props: {
             /* ... */
      }
})
~~~

在renderComponentRoot内部的render实际上就是：

~~~
return () => {
        // 渲染函数或 JSX
        return Vue.h('div', 'hello')
}
~~~

可以看到它返回的就是一个vnode，那么我们其实已经很清楚了，组件vnode是包含一系列js执行逻辑在内的抽象vnode，不面向最终真实dom的生成，而其内部有一个render函数，可以用来生成element vnode，这就是组件vnode转换成真实dom的途径。

但是有时候我们并不会给defineComponent传入函数式声明，有时候我们会这样定义：

~~~js
const testComponent = Vue.defineComponent({
     name: 'MyComponent',
     setup() {
         const message = '这是组合式 API 组件';
         return { message };
     },
     template: '<div>{{ message }}</div>'
})
~~~

此时并没有显示的定义render函数，那么vue怎么处理的呢？

下面给出render的关联链：

~~~ts
instance.render = (Component.render || NOOP) as InternalRenderFunction
~~~

~~~ts
Component.render = compile(template, finalCompilerOptions)
~~~

~~~ts
export function registerRuntimeCompiler(_compile: any) {
  compile = _compile
  installWithProxy = i => {
    if (i.render!._rc) {
      i.withProxy = new Proxy(i.ctx, RuntimeCompiledPublicInstanceProxyHandlers)
    }
  }
}
~~~

~~~ts
registerRuntimeCompiler(compileToFunction)
~~~

实际上render最终会调用compileToFunction这个函数，而这个函数大致内容是：

~~~js
function render(_ctx, _cache) {
  with (_ctx) {
    const { toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = _Vue

    return (_openBlock(), _createElementBlock("div", null, _toDisplayString(message), 1 /* TEXT */))
  }
}
})
~~~

实际上就是vue自动帮我们写了一个render函数，这个render函数和我们手写的大差不差，而compileToFunction这个函数的生成是通过一系列ast编译得到的，感兴趣的读者可以去看看，这里就不多提了。

总而言之，我们已经知道组件vnode是一个用于封装js和element vnode的抽象了，其主要的职能是js侧，而生成真实dom主要还是依赖element vnode。具体来说，组件通过调用render函数生成element vnode，再通过patch去代理真实dom的生成。

### 组件渲染和响应式的联系

最困难的阶段我们都走过来了（creatApp、vnode、diff、组件转换真实dom），响应式实在是很简单了。

我们前面学习过processComponent的内部逻辑，其中组件在mount时（mountComponent函数）会执行以下代码：

~~~ts
const effect = (instance.effect = new ReactiveEffect(
     componentUpdateFn,
     NOOP,
     () => queueJob(update),
     instance.scope, // track it in component's effect scope
))
~~~

看过[vue3响应式原理](https://www.unstoppable840.cn/article/7e6567c0-6ccf-4ecb-b20b-cedce7dc5902)的读者应该很清楚上面的代码是做什么的，其实就是创建了一个响应式副作用，每当响应式数据发生改变时，副作用的第一个参数会被执行，以达到响应式的效果，也就是componentUpdateFn是实现响应式的具体逻辑。

在上一小节中我提到componentUpdateFn再执行时会调用renderComponentRoot，然后renderComponentRoot调用render函数（可以是我们自己定义的，也可以是vue自动生成的），实际上这个过程就是重新渲染组件下的vnode的过程，每次更新都会执行componentUpdateFn，也就是每次更新都会重新渲染vnode（只是为了方便理解，vue做了处理，如果关联的响应式没变是不会重复渲染的），这样是不是就实现了响应式的效果。

### 作者的话

能看到这里的读者相信都是好样的，未来必然也会跻身大佬之列。相信一些初学者会对源码阅读这样的事情望而却步，但是阅读源码并没有想象中困难、高不可攀。我们为什么觉得阅读源码困难？实际上就是因为我们大多数情况是根据其代码去推断其业务逻辑，这其实就违反了依赖倒转原则，我们怎么能从具体推导出抽象呢？虽然不是不可能完成，但是会付出太多不该付出的努力。所以很多大佬都会劝说先把框架玩的很6之后才去阅读源码，暗含的意思就是让大家先把业务弄清楚，以正向去思考业务的实现，后面会发现其实自己想的和源代码写得大差不差。

总而言之，一句话送给各位：大家都在路上~~

### 参考文献

[vue.js core](https://github.com/vuejs/core)

