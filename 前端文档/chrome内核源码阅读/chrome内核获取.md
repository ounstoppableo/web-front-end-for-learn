### 导读

本文内容属于chrome内核阅读合集的一个章节，chrome内核阅读包含了从内核获取到内核解析等一系列内容，能帮助读者深入的理解chrome内核工作原理，其中就有包含浏览器的渲染过程以及v8编译原理等前端基本功知识，对入门和进阶前端技术都会有所帮助。

[点我去到chrome内核阅读导览页面~~](https://www.unstoppable840.cn/article/5d6dd813-2aaa-4991-a91f-e7765f2304da)

### chrome内核获取

chrome内核源码有大约50G，其获取的过程十分令人痛苦，因为在获取的过程中总是会发生一些意想不到的问题使得获取失败，虽然google提供了断点续传的功能，但由于其文件大小基数在那，这个获取过程可能有1小时到数天不等。。。所以请需要获取chrome内核的哥们做好心理准备。

#### github上的chromium

我们都知道github上有google上传的[chromium文件夹](https://github.com/chromium/chromium/)，但是这只算是chrome内核的一个文件导读路径，它的文件列表确实是chrome内核中的文件列表，但也只包含了一层，更深层都转移到google公司自己的版本管理库中了，所以克隆github上的chromium是没有意义的。

比如，如下图所示：

![](.\images\Snipaste_2024-05-31_15-27-03.png)

可以看到v8文件有一个箭头图标，表示其是存在另一个仓库中，通常文件夹内部有`.git`文件夹都会有这个图标，它的出现使得git不会将其存入仓库中，只会作为一个路径标识存储在目录中，证明项目中有这个文件。

#### 从google版本控制库中获取chrome源码

##### 环境配置

###### 使用虚拟环境

chrome源码的获取需要大约50G的空间，虽然它可以直接获取到目标盘，不会缓存在C盘中，但是保险起见还是开一个虚拟机并给其分配100G以上的空间来获取chrome源码，这样可以保证不会污染本机环境，并且对后续chrome编译需要的python环境设置也有好处。

###### 网络设置

chrome是google的产品，所以大家应该能猜的出来需要进行科学上网才能获取，这个这里就靠读者自行发挥了，不过一定要把科学上网的**端口设置为1080**，这是后期经过不断试错得出的血的教训😭😭

###### vs2022下载

vs2022的下载其实是为了chrome进行编译的，如果你只是需要获取源码而不是编译，那么你可以选择不安装，但是以防后期获取时出现一些意想不到的问题这里建议还是安装。

- 首先去到[这里](https://learn.microsoft.com/en-us/visualstudio/releases/2022/release-notes)，下载vs2022社区版，你会得到一个installer

- 进入installer，等安装好vs2022之后点击修改，如下图所示：

  ![](.\images\Snipaste_2024-05-31_15-37-31.png)

- 勾选以下这几个：

  ![](.\images\Snipaste_2024-05-31_15-39-13.png)

  ![](.\images\Snipaste_2024-05-31_15-39-36.png)

  ![](.\images\Snipaste_2024-05-31_15-40-01.png)

- 然后安装即可

###### git环境配置

~~~sh
git config --global user.name "My Name"
git config --global user.email "my-name@chromium.org"
git config --global core.autocrlf false
git config --global core.filemode false
git config --global branch.autosetuprebase always
git config --global core.longpaths true
# 这里要保证端口与自己科学上网开的端口一致，建议将科学上网端口改为1080，否则获取过程可能会发生意想不到的错误
git config --global http.proxy=http://127.0.0.1:1080
git config --global https.proxy=https://127.0.0.1:1080

# 随便clone个文件看网络通不通
~~~

###### 下载depot_tools工具

[点击下载](https://storage.googleapis.com/chrome-infra/depot_tools.zip)

设置一下环境变量：

![](.\images\Snipaste_2024-05-31_15-50-09.png)

之后就可以在cmd中使用depot_tools的命令了，为了避免depot_tools每次执行命令都自动更新，从而耗费大量时间，可以添加以下系统变量：

![](.\images\Snipaste_2024-05-31_15-51-40.png)

设置之后只会在第一次执行命令时更新。

执行以下指令进行首次更新：

~~~sh
gclient
~~~

执行成功会是以下结果，**长时间卡住可能是网络配置问题**：

![](.\images\Snipaste_2024-05-31_15-54-30.png)

之后检查以下python3：

~~~sh
where python3
~~~

![](.\images\Snipaste_2024-05-31_16-07-28.png)

如果depot_tools的python3不在第一个的话可能会对编译造成影响，如上图就不在第一个，可以移动到第一个的文件将该python3文件删除后depot_tools的python3就变成第一个了。

###### 配置一个最关键的参数

打开cmd（最好通过管理者模式打开），然后输入以下命令：

~~~sh
# 注意区分https和http
set https_proxy=http://localhost:1080
~~~

##### chrome源码获取

- 在你喜欢的位置创建chromium文件夹

- 到这个文件夹下打开cmd（最好是管理者模式）

  ~~~sh
  fetch chromium
  ~~~

接下来就是漫长的等待了（以及为随时发生错误做心理准备😇）~~

###### 断点续传

在传输过程中发生失败不要慌，如果你的chromium文件夹下有src文件，那么你可以移动到src文件夹下执行：

~~~
gclient sync
~~~

如果没有src文件夹那么就将chromium整个删了重新获取吧。

###### 正常传输时的cmd模样

有时候我们执行命令后会卡很长一段时间，初次获取chromium源码的人可能会以为这已经算是在获取了，只是没进度而已，实际上获取过程是**有进度的**😇😇

如下图才是正常获取的模样：

![](.\images\Snipaste_2024-05-31_14-02-40.png)

并且文件夹也会持续变大，如果长时间没动静的同学可以再检查一下自己的网络，不要白白被浪费时间了o~~😋

#### 文件汇总

##### gclient执行时间长

建议多等一会儿，如果出现rpc错误拿就说明网络配置有问题，需要重新配置网络

网络配置主要有2点需要注意：

- 科学上网的端口需要设置到1080
- 保证畅通

##### rpc错误

就像下面一样：

~~~
[P7924 01:04:35.134 client.go:312 W] RPC failed transiently (retry in 1s): rpc error: code = Internal desc = prpc: sending request: Post "https://chrome-infra-packages.appspot.com/prpc/cipd.Repository/ResolveVersion": dial tcp: lookup chrome-infra-packages.appspot.com: getaddrinfow: This is usually a temporary error during hostname resolution and means that the local server did not receive a response from an authoritative server. {"host":"chrome-infra-packages.appspot.com", "method":"ResolveVersion", "service":"cipd.Repository", "sleepTime":"1s"}
~~~

rpc错误的出现情况有两种：

- gclient长时间没响应后会出现，按前面提到的要求审查一下网络配置即可

- fetch chromium或gclient sync执行到一部分的时候出错，这种情况通常是遗漏了配置以下命令造成的：

  ~~~sh
  # cmd中执行
  # 注意区分https和http
  set https_proxy=http://localhost:1080
  ~~~

### chrome内核编译

由于博主电脑配置不行，这里就不对chrome编译过多赘述了。

编译可参考[chrome docs](https://github.com/chromium/chromium/blob/main/docs/README.md)