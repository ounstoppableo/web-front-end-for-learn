## 导读

本文内容属于vue3源码阅读合集的一个章节，vue3源码阅读包含了从响应式原理到虚拟dom原理等一系列内容，能帮助读者深入的理解vue3的工作原理，对入门和进阶前端技术都会有所帮助。

[点我去到vue3源码阅读导览页面~~](https://www.unstoppable840.cn/article/9e093c80-4af6-49c0-b9fe-09f393051006)

## VUE3响应式原理

> 代码分析主要体现在注释上，不爱看注释的朋友们悲（😢

先上个图：

![](.\image\vue_reactive.png)

上图就是vue3的响应式原理，下面的内容是具体代码解析。

### Ref代码分析

#### 总体观察代码逻辑

<span id="refSource"></span>

~~~typescript
class RefImpl<T> {
  private _value: T
  private _rawValue: T

  public dep?: Dep = undefined
  // 用于判断是否是ref类型的值，被isRef()函数调用
  public readonly __v_isRef = true

  constructor(
    value: T,
    public readonly __v_isShallow: boolean,
  ) {
    // isShallow表示浅层调用
    this._rawValue = __v_isShallow ? value : toRaw(value)
    /*
    *  其中toReactive()会判断value是不是对象，如果是将其用reactive包装，否则不做修改
    */
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    // 添加跟踪副作用
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    const useDirectValue =
      this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
    newVal = useDirectValue ? newVal : toRaw(newVal)
    if (hasChanged(newVal, this._rawValue)) {
      const oldVal = this._rawValue
      this._rawValue = newVal
      this._value = useDirectValue ? newVal : toReactive(newVal)
      // 执行跟踪副作用,实现响应式
      triggerRefValue(this, DirtyLevels.Dirty, newVal, oldVal)
    }
  }
}
~~~

简化来看，其实就是这样：

~~~ts
class RefImpl<T> {
  private _value
  get value() {
    // 添加跟踪副作用
    track()
    return this._value
  }
  set value(newVal) {
    this._value =  newVal
    // 执行跟踪副作用,实现响应式
    trigger()
  }
}
~~~

**也就是说vue通过get方法去添加相关副作用，等修改时再重新调用这些副作用，从而实现响应式的效果。**

这也是为什么wacth、computed这些钩子通常需要传递函数的原因，传递一个函数更容易被trigger。

#### 具体来看track和trigger的执行逻辑

##### track执行逻辑

~~~ts
export function trackRefValue(ref: RefBase<any>) {
  // 判断当前副作用是否值得被追踪
  if (shouldTrack && activeEffect) {
    ref = toRaw(ref)
    //添加副作用
    trackEffect(
      //当前副作用，生成的逻辑后续会介绍
      activeEffect,
      //当前ref数据是否存在副作用表（散列存储），没有就创建
      (ref.dep ??= createDep(
        () => (ref.dep = undefined),
        ref instanceof ComputedRefImpl ? ref : undefined,
      )),
      __DEV__
        ? {
            target: ref,
            type: TrackOpTypes.GET,
            key: 'value',
          }
        : void 0,
    )
  }
}
~~~

让我们简化一下代码，剔除一些逻辑之外的代码行：

~~~ts
export function trackRefValue(ref: RefBase<any>) {
  if (shouldTrack && activeEffect) {
    trackEffect(
      activeEffect,
	  ref.dep
    )
  }
}
~~~

可以看到上面主要的逻辑就是trackEffect函数，而它就是主要的副作用添加函数，下面我们再看看它的具体内容：

~~~ts
export function trackEffect(
  effect: ReactiveEffect,
  dep: Dep,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo,
) {
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId)
    const oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {
      if (oldDep) {
        cleanupDepEffect(oldDep, effect)
      }
      effect.deps[effect._depsLength++] = dep
    } else {
      effect._depsLength++
    }
    if (__DEV__) {
      // eslint-disable-next-line no-restricted-syntax
      effect.onTrack?.(extend({ effect }, debuggerEventExtraInfo!))
    }
  }
}
~~~

同样，让我们剔除一些逻辑之外的代码行可以得到：

~~~ts
export function trackEffect(
  effect: ReactiveEffect,
  dep: Dep,
) {
  /* 
  	 这里的判断是两步运算：
  	 1.第一步是查看副作用表中是否有该副作用；
  	 2.查看存在的副作用_trackId是否一致。
  */
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId)
    const oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {
      if (oldDep) {
        cleanupDepEffect(oldDep, effect)
      }
      effect.deps[effect._depsLength++] = dep
    } else {
      effect._depsLength++
    }
  }
}
~~~

为了方便理解，我们可以看看下图：

![](.\image\vue_track.png)

该图表示的是副作用和响应式数据间的关系。

通过此图我们就能很好的理解上面的代码了：

~~~ts
// 表示往ref的副作用表中添加副作用，这个没什么好说的
dep.set(effect, effect._trackId)
~~~

~~~ts
/*
* 正常情况下，oldDep会一直是undefined，因为_depsLength是同步增加的
* 在每次进行ref绑定副作用时就会执行以下逻辑，帮助给副作用添加依赖项
*/
const oldDep = effect.deps[effect._depsLength]
if (oldDep !== dep) {
   if (oldDep) {
     cleanupDepEffect(oldDep, effect)
   }
   effect.deps[effect._depsLength++] = dep
} else {
   effect._depsLength++
}
~~~

**正常来说，我们的响应式数据绑定好副作用函数就可以实现响应式了，也就是上面的第一段代码，但是为什么还要执行第二段代码去实现副作用对响应式数据的绑定呢？这个疑问将在计算属性小节进行解答。**

看完上面的代码我们还有一个非常重要的问题，activeEffect到底是怎么生成的？我们知道响应式数据需要绑定副作用函数，并且上面的逻辑也给出了响应式函数绑定副作用函数的具体逻辑，但是这些副作用函数是怎么产生的呢（activeEffect怎么来的）？我们在watch、computed中的执行逻辑是如何转变成副作用函数的？先看下面代码：

~~~ts
// 在计算属性的构造中有这样一行代码
this.effect = new ReactiveEffect(...)
~~~

实际上副作用函数就是通过ReactiveEffect创建出来的，也就是activeEffect是通过ReactiveEffect创建出来的，让我们看看它的结构：

~~~ts
export class ReactiveEffect<T = any> {
  ...
  run() {
    this._dirtyLevel = DirtyLevels.NotDirty
    if (!this.active) {
      return this.fn()
    }
    let lastShouldTrack = shouldTrack
    let lastEffect = activeEffect
    try {
      shouldTrack = true
      activeEffect = this
      this._runnings++
      preCleanupEffect(this)
      return this.fn()
    } finally {
      postCleanupEffect(this)
      this._runnings--
      activeEffect = lastEffect
      shouldTrack = lastShouldTrack
    }
  }
}
~~~

它的内部存在一个run方法，而activeEffect就是通过这个run方法进行赋值的，到这里我们就能知道响应式数据track的流程了，为了方便理解，我画了一个图：

![](.\image\vue_track_2.png)

其实大致的原理并不难理解，也就是把副作用添加到响应式数据的dep中就行了，然而vue采用了一种比较迂回的方式去添加这个副作用，也就是通过引入一个activeEffect这个变量作为桥梁。

看到这里相信各位对track的原理都比较清楚了，但是可能对实际副作用函数是何时执行run()方法以及其他细节问题比较模糊，这些问题都会在后面一一分析。

##### trigger执行逻辑

trigger的执行就比较简单，没有那么多弯弯绕绕。

~~~ts
export function triggerRefValue(
  ref: RefBase<any>,
  dirtyLevel: DirtyLevels = DirtyLevels.Dirty,
  newVal?: any,
  oldVal?: any,
) {
  ref = toRaw(ref)
  const dep = ref.dep
  if (dep) {
    triggerEffects(
      dep,
      dirtyLevel,
      __DEV__
        ? {
            target: ref,
            type: TriggerOpTypes.SET,
            key: 'value',
            newValue: newVal,
            oldValue: oldVal,
          }
        : void 0,
    )
  }
}
~~~

从上面可以知道，triggerRefValue是通过triggerEffects实现出发副作用的，triggerEffects的代码如下（剔除了一部分逻辑之外的代码）：

<span id="triggerEffects"></span>

~~~ts
export function triggerEffects(
  dep: Dep,
  dirtyLevel: DirtyLevels,
) {
  //遍历
  for (const effect of dep.keys()) {
    let tracking: boolean | undefined
    if (
      effect._dirtyLevel < dirtyLevel &&
      (tracking ??= dep.get(effect) === effect._trackId)
    ) {
      effect._shouldSchedule ||= effect._dirtyLevel === DirtyLevels.NotDirty
      effect._dirtyLevel = dirtyLevel
    }
    if (
      effect._shouldSchedule &&
      (tracking ??= dep.get(effect) === effect._trackId)
    ) {
      //触发
      effect.trigger()
      if (
        (!effect._runnings || effect.allowRecurse) &&
        effect._dirtyLevel !== DirtyLevels.MaybeDirty_ComputedSideEffect
      ) {
        effect._shouldSchedule = false
        if (effect.scheduler) {
          queueEffectSchedulers.push(effect.scheduler)
        }
      }
    }
  }
}
~~~

简单来说就是遍历副作用表然后触发。

### reactive代码分析

> 前端面试时，面试官常常会问ref和reactive的区别是什么，能不能所有数据都使用ref？
>
> 看完之后的介绍，你可能就会对这个问题有所答案了。

话不多说，先上代码：

~~~ts
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>,
) {
  // 不是对象
  if (!isObject(target)) {
    return target
  }
  // target已经是proxy
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // target存在对应的proxy
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // target是部分可操作的，比如不可拓展
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  // 以上情况都不新创建
  
  // 创建proxy代理
  const proxy = new Proxy(
    target,
    // 目标为集合的情况或普通对象的情况
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers,
  )
  proxyMap.set(target, proxy)
  return proxy
}
~~~

下面我们分析的是一般对象的情况，也就是看baseHandlers的配置:

~~~ts
class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(false, isShallow)
  }
  get(target: Target, key: string | symbol, receiver: object) {
	。。。
  }，
  set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
	...
  }

  deleteProperty(target: object, key: string | symbol): boolean {
	...
  }

  has(target: object, key: string | symbol): boolean {
	...
  }
  ownKeys(target: object): (string | symbol)[] {
	...
  }
}
~~~

可以看到主要的track和trigger逻辑还是get和set，下面我们就看看这两个方法的定义：

~~~ts
  get(target: Target, key: string | symbol, receiver: object) {
    // 这里如果是数组vue给了单独的处理方法，所以不走track
    const targetIsArray = isArray(target)

    if (!isReadonly) {
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      if (key === 'hasOwnProperty') {
        return hasOwnProperty
      }
    }
	
    // 下面才走track
    const res = Reflect.get(target, key, receiver)

    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res
    }
	
    //track
    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

    if (isShallow) {
      return res
    }

    if (isRef(res)) {
      return targetIsArray && isIntegerKey(key) ? res : res.value
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
~~~

~~~ts
set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ): boolean {
    // 判断是添加还是修改，看有没有这个key
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      // trigger
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
}
~~~

#### track执行逻辑

reactive的track逻辑与ref没有太大区别，但是在粒度上有所区别，reactive的dep精确到具体的key上。

~~~ts
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    // dep精确到key上
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap!.delete(key))))
    }
    // 复用了ref的trackEffect
    trackEffect(
      activeEffect,
      dep,
      __DEV__
        ? {
            target,
            type,
            key,
          }
        : void 0,
    )
  }
}
~~~

#### trigger执行逻辑

trigger需要考虑的问题可能多一点，但也只是在添加deps时逻辑多了一点，trigger还是沿用的ref。

~~~ts
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>,
) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }

  //逻辑就是将dep添加到deps里，分别有集合、数组、普通对象等情况
  let deps: (Dep | undefined)[] = []
  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    deps = [...depsMap.values()]
  } else if (key === 'length' && isArray(target)) {
    const newLength = Number(newValue)
    depsMap.forEach((dep, key) => {
      if (key === 'length' || (!isSymbol(key) && key >= newLength)) {
        deps.push(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      deps.push(depsMap.get(key))
    }

    // also run for iteration key on ADD | DELETE | Map.SET
    switch (type) {
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        } else if (isIntegerKey(key)) {
          // new index added to array -> length changes
          deps.push(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        break
      case TriggerOpTypes.SET:
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY))
        }
        break
    }
    //trigger
    pauseScheduling()
  	for (const dep of deps) {
  	  if (dep) {
  	    triggerEffects(
  	      dep,
  	      DirtyLevels.Dirty,
  	      __DEV__
  	        ? {
  	            target,
  	            type,
  	            key,
  	            newValue,
  	            oldValue,
  	            oldTarget,
  	          }
  	        : void 0,
  	    )
  	  }
  	}
   resetScheduling()
}
~~~

#### ref和reactive的区别解析

我们从前面阅读ref和reactive的源码可以知道，**他们的底层逻辑都是一样的**，通过track和tragger实现响应式的管理，**其中reactive沿用了ref的track和tragger,并且ref在遇到对象数据时也复用了reactive进行代理**，那么为什么在监听对象时使用reactive更合适呢？我们可以观察[ref源码](#refSource)的set value()方法，可以发现ref的赋值是直接替换掉整个reactive对象：

~~~ts
this._value = useDirectValue ? newVal : toReactive(newVal)
~~~

并不是针对单独的某个键进行修改，这样一旦发生修改就需要调用整体ref所绑定的副作用，而不是具体到某个key所绑定的副作用，所以它的运行效率相对于reactive只调用具体某个key的副作用是极大不如的。

> 但是我们观察代码可以发现，vue3在创建原数据为对象的ref时，使用了reactive来进行包装，有的人可能会觉得多余，认为修改数据也是整个对象再重新绑定，并没有体现reactive的作用，但这或许暗涵深意：
>
> 说明未来reactive或许要被并入ref中，实现只通过ref就可以实现reactive修改数据时只调用key值相关依赖的效果。

下面附加一个ref监听对象变化的原理：

通过观察[ref源码](#refSource)我们可以发现set方法中利用了hasChanged函数，下面我们看看hasChanged的原理：

~~~ts
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
~~~

这样就可以监控一个对象的变化了。

### 副作用函数的实现逻辑

什么是副作用？在这里提到可能有点晚。

在我们日常开发中，响应式一般是如何使用的？一般流程就是：定义了一个ref->把他放在computed中、把他放在watch中、把他放在模板中，然后我们就想当然的认为他发生改变后我们对应使用他的地方会得到反馈。

这些使用他的地方是如何得到反馈的？从前述过程我们可以知道是通过trigger去执行他们的触发函数，比如computed、watch的第二个参数，vdom其实也是这个原理，只是没有暴露出来。vue3给这些能够定义触发函数的场景定义了一个名字——**副作用（effect）**

看完vue3的响应式逻辑后，就可以去理解副作用函数的原理了。

#### 计算属性（computed）

计算属性虽然原理很简单，就是类似一种树形调用，去遍历所有依赖关系，并更新结果，但是vue3实现的过程实在是太绕了，涉及到很多代码，所以这里就不再列举代码进行逐行分析了，直接上其内部处理的流程图，读者可以搭配此图去阅读源码：

![](.\image\computed.png)

从上图我们可以知道几个重要信息：

- 当响应式数据发生改变时，其所属的副作用不会立刻去改变他们的值，而是修改其dirtyLevel属性为dirty，直到当被访问时才会从新计算值
- 前面提到的副作用的deps就在这里起了作用，其用于计算属性检测其依赖的响应式数据是否是脏数据从而作为更改自己值的依据

简化的计算属性访问流程如下图所示：

![](.\image\computed_simple.png)

#### 监视器（watch）

<span id="doWatch"></span>

~~~ts
function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: WatchCallback | null,
  {
    immediate,
    deep,
    flush,
    once,
    onTrack,
    onTrigger,
  }: WatchOptions = EMPTY_OBJ,
): WatchStopHandle {
  if (cb && once) {
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      unwatch()
    }
  }

  // 获取组件实例，并没有实际意义，只是通过callWithErrorHandling使报错能够标识到具体的组件
  const instance = currentInstance
  
  // 处理reactive的getter(判断需不需要深度监听)
  const reactiveGetter = (source: object) =>
    deep === true
      ? source 
      : traverse(source, deep === false ? 1 : undefined)

  let getter: () => any
  let forceTrigger = false
  let isMultiSource = false

  /*
  *  对监听的数据进行处理
  *  1.ref自动解构；
  *  2.reactive的情况；
  *  3.数组（多个数据源的情况）的情况；
  *  4.getter的情况；
  */
  if (isRef(source)) {
    getter = () => source.value
    forceTrigger = isShallow(source)
  } else if (isReactive(source)) {
    getter = () => reactiveGetter(source)
    forceTrigger = true
  } else if (isArray(source)) {
    isMultiSource = true
    forceTrigger = source.some(s => isReactive(s) || isShallow(s))
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return reactiveGetter(s)
        } else if (isFunction(s)) {
          return callWithErrorHandling(s, instance, ErrorCodes.WATCH_GETTER)
        }
      })
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = () =>
        callWithErrorHandling(source, instance, ErrorCodes.WATCH_GETTER)
    } else {
      // no cb -> simple effect
      getter = () => {
        if (cleanup) {
          cleanup()
        }
        return callWithAsyncErrorHandling(
          source,
          instance,
          ErrorCodes.WATCH_CALLBACK,
          [onCleanup],
        )
      }
    }
  }
  
  let cleanup: (() => void) | undefined
  let onCleanup: OnCleanup = (fn: () => void) => {
    cleanup = effect.onStop = () => {
      callWithErrorHandling(fn, instance, ErrorCodes.WATCH_CLEANUP)
      cleanup = effect.onStop = undefined
    }
  }

  // 处理深度监听
  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  /*
  *  处理旧值的情况：
  *  判断是不是多数据源（数组）
  *  INITIAL_WATCHER_VALUE为{},这是防止魔法数的写法
  */
  let oldValue: any = isMultiSource
    ? new Array((source as []).length).fill(INITIAL_WATCHER_VALUE)
    : INITIAL_WATCHER_VALUE
  
  /*
  *  用于封装cb函数
  */
  const job: SchedulerJob = () => {
    if (!effect.active || !effect.dirty) {
      return
    }
    if (cb) {
      // run的功能我就不再细说了，简单来说就做两件事：1.清dirtyLevel；2.执行effect的getter获取值
      const newValue = effect.run()
      if (
        deep ||
        forceTrigger ||
        (isMultiSource
          ? (newValue as any[]).some((v, i) => hasChanged(v, oldValue[i]))
          : hasChanged(newValue, oldValue)) ||
        (__COMPAT__ &&
          isArray(newValue) &&
          isCompatEnabled(DeprecationTypes.WATCH_ARRAY, instance))
      ) {
        // 防止cb重复执行
        if (cleanup) {
          cleanup()
        }
        callWithAsyncErrorHandling(cb, instance, ErrorCodes.WATCH_CALLBACK, [
          newValue,
          // pass undefined as the old value when it's changed for the first time
          oldValue === INITIAL_WATCHER_VALUE
            ? undefined
            : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE
              ? []
              : oldValue,
          // 可以初始化cleanup，用于停止cb的执行
          onCleanup,
        ])
        oldValue = newValue
      }
    } else {
      // watchEffect
      effect.run()
    }
  }

  job.allowRecurse = !!cb

  // 控制执行时机，是flush的底层逻辑
  let scheduler: EffectScheduler
  if (flush === 'sync') {
    scheduler = job as any // the scheduler function gets called directly
  } else if (flush === 'post') {
    scheduler = () => queuePostRenderEffect(job, instance && instance.suspense)
  } else {
    // default: 'pre'
    job.pre = true
    if (instance) job.id = instance.uid
    scheduler = () => queueJob(job)
  }

  // 创建副作用，类似计算属性，cb存在scheduler中
  const effect = new ReactiveEffect(getter, NOOP, scheduler)

  // 获取activeEffect,用于处理取消监听的逻辑
  const scope = getCurrentScope()
  const unwatch = () => {
    effect.stop()
    if (scope) {
      remove(scope.effects, effect)
    }
  }

  if (cb) {
    // 初始化立刻执行
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
    // 回调调用时机设置
  } else if (flush === 'post') {
    queuePostRenderEffect(
      effect.run.bind(effect),
      instance && instance.suspense,
    )
  } else {
    effect.run()
  }
  return unwatch
}
~~~

上面已经把doWatch的基本功能解释的差不多了，整体watch的功能应该都清晰了：**也就是判断是否有一些特殊字段（deep、immediate），有就处理，没有就正常绑定回调到effect上，等待依赖的响应式数据变化后被trigger**。

但可能还有一些小点比较难理解，下面将一一解决这些小点：

- **cleanup**：这个函数用于防止回调重复执行，主要的逻辑在job中，类似防抖逻辑

- **oldValue**：有人可能会疑惑oldValue是怎么保存的，doWatch执行完不就要被回收了吗？实际上vue3用了闭包的原理，说实话写的挺绕，这也是vue3的特色了，oldValue被job使用，job又被放入effect，effect又被放入trigger，总之就是能被标记到。

- **traverse**：先上代码吧

  ~~~ts
  export function traverse(
    value: unknown,
    depth = Infinity,
    seen?: Set<unknown>,
  ) {
    // 不是对象或深度为0（为基本数据类型），则直接返回值
    if (depth <= 0 || !isObject(value) || (value as any)[ReactiveFlags.SKIP]) {
      return value
    }
    
    // 记录标记过的值，标记过直接返回结果
    seen = seen || new Set()
    if (seen.has(value)) {
      return value
    }
    seen.add(value)
    
    // 开始处理层，递归处理
    depth--
    if (isRef(value)) {
      traverse(value.value, depth, seen)
    } else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        traverse(value[i], depth, seen)
      }
    } else if (isSet(value) || isMap(value)) {
      value.forEach((v: any) => {
        traverse(v, depth, seen)
      })
    } else if (isPlainObject(value)) {
      for (const key in value) {
        traverse(value[key], depth, seen)
      }
      for (const key of Object.getOwnPropertySymbols(value)) {
        if (Object.prototype.propertyIsEnumerable.call(value, key)) {
          traverse(value[key as any], depth, seen)
        }
      }
    }
    return value
  }
  ~~~

  看了代码，我们发现其实traverse就起到了访问值的作用，也就是访问所有被监听的响应式数据，让其trigger内添加watch的回调

- **forceTrigger**：查看代码可以发现forceTrigger为true的情况一般为这两种`isShallow(source)`、`isReactive(source)`也就是为浅响应式或为reactive包装的数据时为true，那么它为true引发了什么后果呢？查看代码发现看不出逻辑，后来我查找了提交历史`390589e`发现这个是为了用于区分常规ref，当其值没变时不应该触发回调，是处理bug的一个功能，有兴趣的可以去该提交历史查看。
- **为什么reactive需要用getter包装**：其实很简单，为什么ref不用包装？因为ref如果不访问到value属性，他就不会触发trigger去添加副作用，而reactive不行，只要被使用就会将副作用加入trigger，这时候可能副作用还没创建，算是一个优化策略。

### 问题解释

#### vue3的脏数据逻辑

> 我们发现在vue中，响应式变化后会先将副作用的dirtyLevel变为dirty才去触发副作用trigger，这是为什么呢？

从我们上面阅读代码的经验可以看出，dirtyLevel主要是用于计算属性的，watch基本没有关于dirty的逻辑。

既然如此，我就就来分析分析计算属性。

假设计算属性不使用dirtyLevel会发生什么事？

**也就是假设不判断dirtyLevel，每次有人使用它时，都会直接调用run()方法去获取值，而如果加了dirtyLevel，就起到一个缓存的效果，被调用时只有依赖的响应式数据发生变化才会调用run()方法。**

但是有的人可能会疑惑，即使不缓存，它每次都去调用run()获取结果真的会对性能有很大的影响吗？

我们可以看看run()方法的逻辑：

~~~ts
 run() {
    this._dirtyLevel = DirtyLevels.NotDirty
    if (!this.active) {
      return this.fn()
    }
    let lastShouldTrack = shouldTrack
    let lastEffect = activeEffect
    try {
      shouldTrack = true
      activeEffect = this
      this._runnings++
      preCleanupEffect(this)
      return this.fn()
    } finally {
      postCleanupEffect(this)
      this._runnings--
      activeEffect = lastEffect
      shouldTrack = lastShouldTrack
    }
  }
~~~

可以发现能造成性能影响的也就是调用this.fn()，也就是调用getter函数了。而每次获取ref的值时，ref都会触发track，但是实际上vue3中写了逻辑，如果副作用被track过就不会再被track了。而且使用的也是散列判断，几乎不会太耗性能。

那也就是run()方法的调用并不会对性能有过多影响，但是dirtyLevel的作用除了作为run()方法的前置外，还作为trigger的前置，既然run()的执行对性能不会有太大的影响，**那么就是trigger的执行会对性能有很大的影响**

我们查看[triggerEffects的代码](#triggerEffects)，**可以triggerEffects每次被调用都会遍历副作用并执行这些副作用的trigger，我们知道底层副作用的trigger基本就是和页面绑定了，也就是每次执行这些副作用都会造成页面的再渲染，而这个渲染过程就是性能降低的罪魁祸首。**

#### scheduler

> 在[triggerEffects的代码](#triggerEffects)中，我们可以发现存在一个scheduler的逻辑，这个scheduler的作用究竟是什么呢？

我们需要追根溯源，找出schedular是在哪出现的，发现它其实是作为副作用类被实例化的第三个参数所生成的：

~~~ts
export class ReactiveEffect<T = any> {
	constructor(
	    public fn: () => T,
	    public trigger: () => void,
	    public scheduler?: EffectScheduler,
	    scope?: EffectScope,
	  ) {
	    recordEffectScope(this, scope)
	  }
}
~~~

计算属性、监视器等各种作为副作用的生成都需要通过new ReactiveEffect()，而计算属性对new ReactiveEffect()的调用并没有传入scheduler，所以基本可以判断scheduler和计算属性没有关系了，有关系的就只有watch了。

我们可以阅读[watch源码](#doWatch)发现scheduler实际上就是监视器的cb。再观察scheduler的生成逻辑：

~~~ts
let scheduler: EffectScheduler
if (flush === 'sync') {
  scheduler = job as any // the scheduler function gets called directly
} else if (flush === 'post') {
  scheduler = () => queuePostRenderEffect(job, instance && instance.suspense)
} else {
  // default: 'pre'
  job.pre = true
  if (instance) job.id = instance.uid
  scheduler = () => queueJob(job)
}
~~~

发现它也就是作为watch的flush被使用，flush的作用是什么？确定cb的执行时机，比如`flush: 'post'`就是在updated之后执行，`flush: 'sync'`就是在beforeUpdate之后执行。

那其实我们就很明白了，scheduler就如同其字面意思一样，是一个调度员。用于管理副作用的执行时机。

下图是具体scheduler执行流程：

![](.\image\scheduler.png)

然后具体scheduler又有对应的执行栈，从flush原理就可看出来，实现使cb在vue的不同生命周期执行的效果，这里就不过多赘述了。

#### 引入activeEffect的作用

> 在阅读响应式原理时，我们会被activeEffect的引入弄蒙，为什么vue要引入这个对象，而不是直接将副作用加入track就完事了？

其实这个涉及到单例涉及模式的好处，使副作用可控且数据流单一，如果我们不引入activeEffect，副作用漫天飞，这样不利于维护和管理。

## 参考文献

[vue.js core](https://github.com/vuejs/core.git)
