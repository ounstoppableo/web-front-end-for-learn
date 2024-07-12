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

![](C:\Users\Administrator\Desktop\笔记\image\vue_track.png)

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

**正常来说，我们的响应式数据绑定好副作用函数就可以实现响应式了，也就是上面的第一段代码，但是为什么还要执行第二段代码去实现副作用对响应式数据的绑定呢？这个疑问我们先做保留。。**

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

我们从前面阅读ref和reactive的源码可以知道，**他们的底层逻辑都是一样的**，通过track和tragger实现响应式的管理，**其中reactive沿用了ref的track和tragger**，那么为什么在监听对象时使用reactive更合适呢？相信读到这里的朋友都发现了reactive有一个决定性的不同，**那就是它会给对象的每个key创建一个dep**，不像ref即使面对对象也是统一管理dep，这就造成ref如果对象的某个key发生了变化，它会将对象所有key所关联的dep都执行，而reactive则可以细粒度到具体的key的dep上，这在执行tragger的量级上就出现了变化，这就是监听对象时reactive比ref更好的原因。

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

这里面涉及到一个schedular，是vue3的任务管理机制，会在后面讲解，现在只需要知道其能避免执行栈被撑爆。

一般的访问流程如下图所示：

![](.\image\computed_simple.png)

#### 监视器（watch）



### 问题解释

#### 为什么副作用函数还要添加deps来管理响应式依赖？

#### vue3的脏数据逻辑

#### schedule

#### 引入activeEffect的作用

