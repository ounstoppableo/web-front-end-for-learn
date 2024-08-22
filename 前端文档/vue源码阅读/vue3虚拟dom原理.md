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

可以发现ensureRenderer是一个单例工厂，它返回一个渲染器的单例，如果已经创建过渲染器就不再进行创建了，也就是说不管创建多少个vue实例，发生作用的都只有一个渲染器，不过也不会有人会无聊去创建多个vue实例。而createRenderer方法内容如下：

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

在patch中，核心的逻辑就是processElement和processComponent了，其他的如comment、static、text的逻辑十分简单，而suspense、teleport又存在复用processElement的逻辑，所以下面主要是针对processElement、processComponent的逻辑进行阐述。

processElement:

![](.\image\processElement.png)

其中patchKeyedChildren和patchUnkeyedChildren是diff的逻辑，我会在给出processComponent的流程图后再具体来看。

processComponent:

![](.\image\processComponent.png)

可以发现图中需要特别了解的函数主要有componentUpdateFn，move可以看成是对insert进行了一个封装，逻辑不复杂，这里就不再赘述。下面将给出包括processElement的patchKeyedChildren和patchUnkeyedChildren与componentUpdateFn总共三种函数的执行流程图：

componentUpdateFn:

![](.\image\componentUpdateFn.png)



### 组件渲染和响应式的联系

### 问题集

#### namespace的作用

#### dynamicChildren





