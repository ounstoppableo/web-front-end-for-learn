### 导读

git是目前最流行的版本管理工具，基本的使用很简单，但是也存在复杂的地方，其中最为复杂且最为核心的就是`git rebase`指令。弄懂`git rebase`，完全可以说你的git已经通关了，本篇文章将介绍关于`git rebase`的基本用法、效果可视化、使用场景等。

### 变基模式

首先我们来看看变基的命令格式：

~~~sh
git rebase [--onto <newbase>] [<upstream> [<branch>]]
~~~

上面的命令有五种情况：

~~~sh
git rebase --onto newbase upstream branch
~~~

~~~sh
git rebase --onto newbase upstream
~~~

~~~sh
git rebase --onto newbase
~~~

~~~sh
git rebase upstream branch
~~~

~~~sh
git rebase upstream
~~~

下面我们将就这五种形式的命令进行解释，在这之前，先看看如何理解变基：

变基顾名思义，就是将基准变更。那么我们会面临以下几个问题：

- 谁是基准
- 从哪开始变
- 变到哪

#### 指定[--onto]的情况

##### 指定\<branch\>的情况

~~~sh
git rebase --onto newbase upstream branch
~~~

- 谁是基准

  在上面的命令中，基准就是`newbase`

- 从哪开始变

  在上面的命令中，变化的范围为`upstream`与`branch`开始分叉的位置到`branch`的head

- 变到哪

  在上面的命令中，变化将作用到`branch`分支上

我们用一个图来更直观的解释：

![](.\images\png.png)

简单来说，就是将`branch`与`upstream`不同的部分摘取，插入`newbase`之后，这个过程看起来就像把基准给换了，所以被称为换基。其中我们发现`E2`、`F`、`G`变为了`E2'`，`F'`，`G'`，为什么要这样表示？我们从下面的实例中解释。

现在我们来看看真实案例：

首先可以看到我们有三个分支：

![](.\images\Snipaste_2025-04-11_13-45-09.jpg)

`newbase`分支的提交情况如下：

![](.\images\Snipaste_2025-04-11_13-46-25.jpg)

`upstream`分支的提交如下：

![](.\images\Snipaste_2025-04-11_13-47-01.jpg)



`branch`分支的提交如下：

![](.\images\Snipaste_2025-04-11_13-48-11.jpg)

契合了我们前面给出的图片，为了印证指定`branch`分支是否会将`git rebase`的执行结果存储在`branch`分支，我们将在`newbase`分支上执行`git rebase`：

![](.\images\Snipaste_2025-04-11_13-50-39.jpg)

因为我的例子中修改的都是一个文件，所以会出现冲突，问题不大，解决冲突后执行以下命令即可：

![](.\images\Snipaste_2025-04-11_14-05-13.jpg)

然后跳转到这个界面：

![](.\images\Snipaste_2025-04-11_14-10-52.jpg)

因为`E2`将接在`D0`后面，所以`E2`的提示词保持不变，只是为了区分是处理过的，我们将其改为`E2'`：

![](.\images\Snipaste_2025-04-11_14-31-09.jpg)

`!wq`之后，会发现F和G也发生了冲突，原因也是因为我是在同一个文件上进行的修改，这里的F和原来的branch分支的F已经不是一个东西了，因为它们前面的基变了。

> 这也就是所谓人体的细胞每6个月进行全面换代，6个月后的你还是现在的你吗？是不是感觉像是又好像不是？`git rebase`也是这种感觉。

和`E2`同理，都给它们加上`'`，这里就不再做截图了，下面就是最终结果：

`newbase`：

![](.\images\Snipaste_2025-04-11_14-38-04.jpg)

`upstream`:

![](.\images\Snipaste_2025-04-11_14-38-54.jpg)

`branch`：

![](.\images\Snipaste_2025-04-11_14-37-12.jpg)

结果与我们预期的一样，改变的只有`branch`分支，这其实在执行`git rebase`时，如果指定了`branch`，那么`git rebase`就会在内部隐式的调用`git switch`先去替换分支到`branch`，然后再进行后续操作。

##### 不指定\<branch\>的情况

~~~sh
git rebase --onto newbase upstream
~~~

- 谁是基准

  在上面的命令中，基准就是`newbase`

- 从哪开始变

  在上面的命令中，变化的范围即为`upstream`与`当前分支`开始分叉的位置到`当前分支`的head

- 变到哪

  在上面的命令中，变化将作用到`当前分支`上

我们用图来解释：

![](.\images\Snipaste_2025-04-16_14-33-32.jpg)

![](.\images\Snipaste_2025-04-16_14-32-53.jpg)

对应关系如下：

![](.\images\Snipaste_2025-04-16_14-27-29.jpg)



- 假设当前分支为`newbase`

  - 从哪开始变

    `upstream`->`newbase`显然没有相应的节点，所以为空

  所以也就是直接将基准变为`newbase`，但是当前分支又是`newbase`，所以没有变化

  执行结果：

  ![](.\images\Snipaste_2025-04-16_14-34-40.jpg)

  ![](.\images\Snipaste_2025-04-16_14-35-21.jpg)

  可以发现结果如我们预期。

- 假设当前分支为`upstream`

  - 从哪开始变

    `upstream`->`newbase`显然没有相应的节点，所以为空

  所以也就是直接将基准变为`newbase`，当前分支为`upstream`，所以`upstream`将与`newbase`相同

  执行结果：

  ![](.\images\Snipaste_2025-04-16_14-37-59.jpg)

  可见结果也如预期，`newbase`就不再截图。

- `当前分支`也可以为第三分支，那情况就如`指定<branch>的情况`小节一致。

##### 不指定\<upstream\>的情况

~~~sh
git rebase --onto newbase
~~~

git官方给出了以下解释：

> 如果未指定 `<upstream>` ，则将使用 `branch.<name>.remote` 中配置的上游，并且将使用 `branch.<name>.merge` 选项，并假定 `--fork-point` 选项。如果您当前不在任何分支上，或者当前分支没有上游配置的分支，则折叠将中断。

> `branch.<name>.remote`是什么？
>
> 一般情况下`branch.<name>.remote`指代我们的远程分支，我们可以通过以下指令查看当前分支和`branch.<name>.remote`的关联情况：
>
> ~~~sh
> git branch -vv
> ~~~
>
> ![](.\images\Snipaste_2025-04-16_16-53-52.jpg)
>
> 此时可以发现我们并没有关联什么，接下来我们可以执行该命令：
>
> ~~~sh
> git branch --set-upstream-to=upstream # 用于设置branch.<name>.remote
> ~~~
>
> ![](.\images\Snipaste_2025-04-16_16-56-20.jpg)
>
> 这时就可以发现关联关系了，由于我们使用的还是以下状态：
>
> ![](.\images\Snipaste_2025-04-16_14-27-29.jpg)
>
> 此时可以发现`upstream: ahead 1,behind 2`的字段，表示的就是两分支间的差异。

现在就可以解释官方的那句话了，**如果没有指明`upstream`，那么`branch.<name>.remote`就是`upstream`，如果`branch.<name>.remote`也没设置，那就中断所有操作。**

现在我们再来回答那三个问题：

- 谁是基准

  在上面的命令中，基准就是`newbase`

- 从哪开始变

  在上面的命令中，变化的范围即为`branch.<name>.remote`与`当前分支`开始分叉的位置到`当前分支`的head

- 变到哪

  在上面的命令中，变化将作用到`当前分支`上

其实效果和前两小节一致，只不过`upstream`不是显式设置的，这里就不再过多赘述。

#### 不指定[--onto]的情况

如果不指定`--onto`，那么`git rebase`指令将如下所示：

~~~sh
git rebase <upstream> [<branch>]
~~~

总共有两种情况：

~~~sh
git rebase upstream branch
~~~

~~~sh
git rebase upstream
~~~

##### 指定\<branch\>

我们先看指定branch的情况：

~~~sh
git rebase upstream branch
~~~

再来回答那三个问题：

- 谁是基准

  在上面的命令中，基准就是`upstream`。

- 从哪开始变

  在上面的命令中，变化的范围为`upstream`与`branch`开始分叉的位置到`branch`的head

- 变到哪

  在上面的命令中，变化的结果将保存在`branch`分支。

以下是图示：

![](.\images\png1.png)

我们沿用上面例子中的`newbase`和`upstream`分支：

- `newbase`->`upstream`

- `upstream`->`branch`

因为考虑到在执行`git rebase`中的合并过程和上个例子一致，所以下面就只给出执行结果：

首先我们在`upstream`分支进行操作：

![](.\images\Snipaste_2025-04-11_16-18-07.jpg)

处理冲突并成功`git rebase`后，`upstream`分支：

![](.\images\Snipaste_2025-04-11_15-08-10.jpg)

`branch`分支：

![](.\images\Snipaste_2025-04-11_14-32-15.jpg)

可以发现即使是在`upstream`分支进行操作，最后的结果也存入了`branch`中，和之前有`branch`的结论一致，都会在`git rebase`执行时调用`git swicth`到`branch`分支。

##### 不指定\<branch\>的情况

~~~sh
git rebase upstream
~~~

由前面的经验，我们可以知道，当不指定`branch`时，`当前分支`就为`branch`，于是我们可以回答那三个问题：

- 谁是基准

  在上面的命令中，基准就是`upstream`。

- 从哪开始变

  在上面的命令中，变化的范围为`upstream`与`当前分支`开始分叉的位置到`当前分支`的head

- 变到哪

  在上面的命令中，变化的结果将保存在`当前分支`分支。

我们来看这种情况：

![](.\images\Snipaste_2025-04-16_18-46-22.jpg)

![](.\images\Snipaste_2025-04-16_18-47-10.jpg)

![](.\images\Snipaste_2025-04-16_18-44-36.jpg)

下面我们在`branch`分支执行此命令：

![](.\images\Snipaste_2025-04-16_18-51-10.jpg)

处理完冲突后：

![](.\images\Snipaste_2025-04-16_18-52-43.jpg)

可以发现和上一小节效果一致，也印证了我们的理论。

#### 总结

看了上面的例子，我们可以总结：

- `--onto`是为了变到新的基准
- 不加`--onto`是在原来的基准上进行变换

其中还有一种特殊的写法，比如我们针对下图进行操作：

![](.\images\Snipaste_2025-04-17_18-08-29.jpg)

```sh
git rebase --onto upstream~5 upstream~3 upstream
```

结果如下图：

![](.\images\Snipaste_2025-04-17_18-11-09.jpg)

我们可以将F当作0，然后每往后一个+1，再套入我们前面提到的三个问题，就可以得出这个结果了，感兴趣的读者可以试着推演一下。

### 交互（interactive）模式

#### 基本概念

交互模式的指令：

~~~sh
git rebase <-i | --interactive> [--onto <newbase>] [<upstream> [<branch>]]
~~~

看到上面的命令相信很多读者都会被吓一跳，本来变基模式就很复杂了，交互模式怎么还在变基的基础上操作！

实际上，交互模式并不是什么新的东西，它只是提供给我们一个编辑页面，比如：

![](.\images\Snipaste_2025-04-11_14-31-09.jpg)

在以前的变基中，只有遇到冲突时我们才会进入到上面的界面，但如果加上了`-i`之后，我们可以立马跳转到这个界面，从而可以进行一些更细致的操作。

比如说我们想进行如下操作：

![](.\images\Snipaste_2025-04-17_18-47-07.jpg)

我们发现`F'`和`E'`交换了顺序！虽然在现实中这样的操作并不多，但它可以说明一种情况，交互模式可以在变基的基础上进行更细致的操作，比如节点交换。

交互模式只能展示线性的分支，比如：

| 状态                                           | 可展示 |
| ---------------------------------------------- | ------ |
| ![](.\images\Snipaste_2025-04-17_18-08-29.jpg) | ✅      |
| ![](.\images\Snipaste_2025-04-16_18-44-36.jpg) | ❌      |

有的读者可能会有疑惑，既然是线性的，为什么还能像变基一样指定多个分支呢？这就是读者经常会走入的一个误区，变基实际上最终还是作用在一个分支上的，比如我们指定了branch，不管前面是怎么样，最终都会作用到branch分支上，而交互模式进入的就是此时的状态，可以线性的展示branch的变化情况。

#### 操作

交互模式具体拥有的操作有以下几种：

我们以下图的分支来做同步做解释：

![](.\images\Snipaste_2025-04-18_08-33-53.jpg)

当我们执行：

~~~sh
git rebase -i upstream~5 
~~~

> 这个指令非常坑，我们在之前实际上也接触过了~number这样的语法，其表示的就是从HEAD开始往前数5个提交，那么正常来讲upstream~5应该是会数到A的，但是实际上只数到B，对于上面的指令我们可以这样理解：
>
> “我想要 rebase 从 `topicA~4` 到 `topicA` 之间的所有提交”

![](.\images\Snipaste_2025-04-18_08-44-26.jpg)

- pick

  默认操作，即保持该提交不变

- reword

  保持提交，但是可以修改提交信息

  我们像这样修改：

  ![](.\images\Snipaste_2025-04-18_08-45-30.jpg)

  然后进入：

  ![](.\images\Snipaste_2025-04-18_08-46-03.jpg)

  修改成：

  ![](.\images\Snipaste_2025-04-18_08-46-34.jpg)

  结果：

  ![](.\images\Snipaste_2025-04-18_08-47-10.jpg)

- edit

  保持提交，但是可以作为`--amend`操作

  我们像这样修改：

  ![](.\images\Snipaste_2025-04-18_08-49-10.jpg)

  保存后，我们得到：

  ![](.\images\Snipaste_2025-04-18_08-49-58.jpg)

  并且我们发现我们已经在C提交上了：

  ![](.\images\Snipaste_2025-04-18_08-50-48.jpg)

  现在就可以对C提交的文件进行我们希望的修改，具体修改什么我就不再演示，修改文件后会与后来的提交有冲突，需要解决冲突才能继续，下面是修改后的log：

  ![](.\images\Snipaste_2025-04-18_08-55-44.jpg)

- squash

  合并提交到上一个提交

  我们像这样修改：

  ![](.\images\Snipaste_2025-04-18_08-56-30.jpg)

  然后进入这个界面：

  ![](.\images\Snipaste_2025-04-18_08-57-05.jpg)

  这里是让你修改提交信息的，如果我们需要保留某一个信息，可以使用#注释掉其中一个信息，如果两个都不想保留，也可以把两个都注释，重新写一个信息，在这里我们就都不注释：

  ![](.\images\Snipaste_2025-04-18_08-59-32.jpg)

- fixup [-C | -c]

  fixup的操作和sqush是一样的，只不过会暴力的合并提交信息，但加了-c或-C可以修改提交信息

  我们像这样修改：

  ![](.\images\Snipaste_2025-04-18_09-00-48.jpg)

  没有提醒我们进行信息修改，直接生成结果：

  ![](.\images\Snipaste_2025-04-18_09-01-47.jpg)

  D直接被融合进B’中了。

- exec

  执行shell指令

- break

  在这暂停，可以通过`git rebase --continue`进入

- drop

  移除提交，修改过的文件内容会丢失，新增的文件会被删除

- label

  用于标记提交，通常和`reset`和`merge`合用，我们从`reset`和`merge`中体会`label`

- reset

  用于重置提交，类似`git reset --hard xxx`

  比如我们有如下分支：

  ![](.\images\Snipaste_2025-04-18_14-23-43.jpg)

  此时我们进入交互界面并进行修改：

  ![](.\images\Snipaste_2025-04-18_14-26-38.jpg)

  结果：

  ![](.\images\Snipaste_2025-04-18_14-27-40.jpg)

- merge

  label+reset+merge可以实现清理提交链的功能

- update-ref

  在某个提交处创建一个新分支，比如：

  ![](.\images\Snipaste_2025-04-18_14-40-33.jpg)

  结果：

  ![](.\images\Snipaste_2025-04-18_14-48-08.jpg)

  ![](.\images\Snipaste_2025-04-18_14-48-48.jpg)

### git rebase的两个基座

`git rebase`的两个基座分别为apply和merge，用于在`git rebase`遇到冲突时进行处理。

merge实际上就是git merge，所以下面的差异我们主要说说apply的行为。

我们的默认基座是merge，我们可以通过下面指令进行基座的切换：

~~~sh
git rebase --apply
git rebase --merge
~~~

它们的一些差异：

- 空提交

  - apply会有意的删除空提交

- 目录重命名检测

  - apply不会检测到目录的重命名，这意味着，如果两个人进行同一个分支的开发，一个人修改了目录名，生成新的目录，而另一个人在旧目录中添加文件，此时如果合并，旧目录中新增的文件将被忽略。简单来说，新目录和旧目录在apply中并没有关联关系，就类似于你创建了一个新目录，你如果在旧目录中添加文件，新目录是无法感知到的。

- 上下文

  上下文是处理提交的一种方式。

  - 对于merge来说，所有提交都作用在完整的文件上，即使只修改了某一行。

  - 对于apply来说，提交并不是作用在完整的文件上，而是提取出变化的地方形成一系列补丁，一个补丁所包含的内容有：行号、上下文区域、实际更改。

    然后通过确认这些补丁去完成变基。

  下图是关于两者的对比：

  ![](.\images\Snipaste_2025-04-18_13-56-34.jpg)

  所以merge的上下文是整个文件；而apply的上下文是文件中修改处的截断，包含较少的上下文，这样使得可能会出现多个上下文相同的情况，此时进行冲突处理时我们很难进行判断。

- 冲突标记

  - apply

    ![](.\images\Snipaste_2025-04-18_11-37-20.jpg)

  - merge

    ![](.\images\Snipaste_2025-04-18_11-38-34.jpg)

  看出区别了吗？merge能知道传入的更改是哪个提交，而apply不能。

- 挂钩

  在git中会有一些钩子（生命周期），比如`pre-commit`，我们可以通过`.git/hooks/post-commit`找到该生命周期的文件，然后在该文件中定义一系列指令，这样在git执行commit之前会调用该钩子，然后执行这些指令，比如：

  ![](.\images\Snipaste_2025-04-18_11-11-55.jpg)

  然后我们提交一些东西：

  ![](.\images\Snipaste_2025-04-18_11-14-16.jpg)

  钩子通常会被我们用来做一些git提交的规范，比如`commitlint`插件。

  现在话说回来，apply和merge在挂钩中有什么差异：

  - apply不会调用`post-commit`
  - 虽然apply和merge在其他hooks上名称相同，但是具体调用时机可能存在一些差异，未来git维护团队可能会取消其中一个

- 中断性

  apply有安全问题，如果用户在错误的时间按`ctrl-c`尝试中止rebase ，rebase会进入一个不能使用`git rebase --abort`中断的状态。

- 提交信息修改

  当rebase发生冲突时，rebase停止并要求用户解决。由于用户在解决冲突时可能需要进行显着更改，因此解决冲突并在用户运行 `git rebase --continue` 之后，会打开编辑器并要求用户更新提交消息。merge会这样，而apply会盲目应用原始提交消息。

综上所述，**我们平时的使用最好不要轻易修改默认后端**。

### git rebase实践

前面讲了那么多东西，读者可能还是云里雾里，这个变基的作用到底是什么呢？

我们来思考一下一个场景，我们开发软件是不是都会使用到外部的组件库，但是有时候外部组件库并不能满足我们的需求，于是我们维护了一个版本，用于自己项目内部的使用，但是此时我们又希望能够获取到外部组件库的更新。

这样讲起来很绕，我们来看下图：

![](.\images\Snipaste_2025-04-18_13-15-52.jpg)

我们可以将`outerComponentStore`当作`upstream`分支，`interComponentStore`当作`branch`分支进行rebase，处理冲突后就可以得到我们想要的结果了：

![](.\images\Snipaste_2025-04-18_13-20-45.jpg)

那么`newbase`的使用场景又是什么呢？我们考虑一下场景：

![](.\images\Snipaste_2025-04-18_13-27-03.jpg)

实际操作就是将`v1.1`当作`upstream`，`interComponentStore`当作`branch`，`v1.2`当作`newbase`，执行rebase之后：

![](.\images\Snipaste_2025-04-18_13-28-59.jpg)

### 参考文献

[git-rebase](https://git-scm.com/docs/git-rebase)
