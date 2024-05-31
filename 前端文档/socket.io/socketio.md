## socket.io介绍

***socket.io是什么？***

socket.io实际上就是一个库，他提供的接口能帮助我们快速实现***实时通信***以及***消息分发管理***的需求。

当然，我们需要在后端和前端都需要配套使用socket。

socket.io与websocket的区别：

- websocket是协议，类似http
- socket.io是工具，是建立在websocket之上的，当然，其使用的协议不止websocket

***在什么场景下会需要实时通信呢？***

- 聊天室
- 游戏
- 在线编辑
- ...

总而言之，实时通信的场景无处不在，于是socket的作用也就无处不在。

***socket.io的竞品有哪些？***

- Twisted
- Boost.Asio
- Netty
- libevent

虽然竞品五花八门，但是它们的核心功能都是一样的，所以我们不必对选择哪样产品过多烦恼，它们都是成熟的库，所以在性能上并不会有明显的优劣之分，选择的原因很大程度上还是根据个人使用的喜好。

***socket.io支持的语言***

- Node.js

- Deno
- Java
- Python
- Golang
- Rust

因为我个人使用的是node.js，所以关于后续的案例我也是使用node.js版的socket.io。

## 浅谈socket.io原理

### 实时通信的原理

***实时通信是什么意思呢？***

以聊天室为例，我们在发送一个消息到群里的时候，是不是所在群的用户都能接受到这个消息，那是因为服务器将发消息的客户的消息转发给了群内的所有用户，而这种能够由***服务器主动推送消息***的情况就被称为实时通信。

***常规http下的局限***

根据以往的http实践中，我们似乎无法让服务器主动去向客户端发送消息，试着回想一下以前的软件开发，是不是大部分情况都是前端主动调用API去向后端索取数据，而后端除了被动的接受请求之外，似乎就没有办法主动向客户端主动推送消息，这是因为http通信的局限性导致的。

http的局限性为：http的设计之初就是一个***请求-响应协议***，如果客户端不进行请求，那么服务器是无法主动发送消息的，即使http1.1提供了长连接（keep-alive），但是服务器依旧没有途径主动向客户端发送消息，长连接主要是方便客户端不用每次请求都需要经过tcp握手，从而影响网络通信时长。

所以总的来说，常规的http是不具备实时通信的能力的。

***实时通信的实现途径***

前面提到常规的http无法实现实时通信，也就是无法实现服务器推送，但是如果我们换个思路，使用客户端不时地主动向服务器发送请求，询问目前是否有需要更新地内容，然后服务端进行正常的响应，只要这个请求的间隔无限小，是不是这种方式也就无限接近于服务器推送呢？

但是根据实际情况，这种请求方式对服务器性能的损耗太大，不可能做到请求间隔无限小，但是可以距离一定的间隔，比如隔个1s、10s......主要还是根据实际情况来定夺，这就是所谓的***http轮询（polling）***。

即使相隔一定的时间，也无法否认其对服务器性能的损耗，比如如果请求的人数达到一定的程度，请求的先后存在参差，那即使再大的时间间隔，服务器也会不停的工作。

为了解决这个问题，程序员们又提出了一个新的思路，那就是客户端只需要发送一个请求即可，服务器在数据没做更新的时候就不响应这个请求，只有到数据发生变化时再进行响应，这就是所谓的***http长轮询（Long Polling）***。

但是同样是人数的问题，如果挂起的响应过多，对服务器的各种资源的占用也会过多，所以这也不是一个完美的方法。

最后一种方式就是http的升级协议***websocket***，它是通过建立TCP长连接而维持服务器与客户端的通信的，在websocket协议中实现了服务器推送的功能。

三者的优劣：

- http轮询

  优点：

  - 实现比较简单
  - 能满足基本的实时通信要求

  缺点：

  - 过度的请求，消耗服务器带宽
  - 实时性会有延迟，比如每秒进行发送的话延迟就是1s

- http长轮询

  优点：

  - 减少了不必要的带宽资源浪费
  - 接近websocket的实时推送功能

  缺点：

  - 大量挂起的请求会占用服务器资源
  - 对于客户端进行请求要花费大量的延迟（等有消息才响应）才能获取结果，这在很多场景不太适用，而且很不灵活，比如消息是持续发送的，那么服务器在推送了新消息之后，要等待客户端的再次请求才能进行推送，这种情况还是会造成一定的消息延迟的，而且还可能造成数据丢失。

- websocket

  优点：

  - 原生支持服务器推，建立连接只需要进行一次tcp连接，之后就可以无延迟推送消息

  缺点：

  - 对于消息的管理比较复杂
  - 需要服务器和客户端双方都支持websocket协议（不过现在都4202年了，这个应该不成问题）

到了现在，我们可以给socket.io进行一个定义，***socket.io实际上就是基于上述几种（实际上就只有websocket和长轮询）实时通信手段的一个管理工具***。

### socket.io相对实时通信的增量

前面我们有提到3种方式实现实时通信，但是这只是实现了***服务器推***的功能，实时通信还需要保证***数据传输的稳定性***。

关于可能会造成不利于数据传输的稳定性的因素有一下几种：

- 客户端不支持websocket，如果没有替代方案，那么服务就无法使用
- websocket通信中可能会出现其中一方的断线，那么这时如果还无脑的进行推送，不释放资源，会造成数据丢失以及服务器资源的损耗。websocket是无法自动监控到对方的不正常离线的，一般来说正常离线是会发送TCP挥手包的，但是如果是突然关闭页面，那么就不会给服务器退出信号

针对这两个问题，socket.io都提出了解决方案bnqk：

- 如果客户端不支持websocket协议，socket会自动回退至使用***http长轮询***（并没有使用轮询）
- 对于断线检测功能，socket.io利用了心跳机制，也就是服务器端会定期进行向客户端进行询问（你吃了吗？🤗🤗你吃了吗？🤗🤗~~），如果客户端不回复，就判断已经断线。
- 而针对数据丢失问题，socket.io提供了数据包缓冲，在客户端断线后进行缓冲，等重连上之后再继续传输

除了这些之外，socket.io还提供了很多便利的功能。

我们回到websocket的使用上，前面我们提到websocket提供了服务器推的功能，于是我们可以利用websocket来进行实时通信，但是实时通信在实际使用场景下也是存在许多门道的。比如在单文档的实时编辑中，我们似乎就不需要考虑太多其他问题，只需要利用websocket管理整个文档就行了，但是如果是多文档的实时编辑，是否要对不同的文档都建立一个websocket连接呢？再比如聊天室，我们需要对每个群组都建立一个websocket连接吗？答案显然是不能的，因为这对资源的损耗是非常大的。

> 这里我们需要弄清http服务、websocket服务、http连接、websocke连接。
>
> 简单来说http服务是用于提供http连接的，一个http服务可以提供多个http连接，就比如我们开启了一个http服务，然后可以在http服务下定义多个接口，这些接口都可以提供独立的http连接，那么就会造成一个局面，也就是一个客户端可以建立多个连接（也就是同时请求多个接口）。
>
> ***而我这里提到的连接就是一个客户端能与服务器建立多少连接的数量，http因为连接时间短，所以不必考虑这个问题，但是websocket建立的是长连接，所以不得不考虑这个问题***
>
> websocket服务和http服务一样，也可以对一个客户端提供多个websocket连接，这个操作可以通过命名空间实现，也就是http里的路径，但是我们需要弄清的问题就是，是否对于每个群组，我们都需要额外的连接来维持？前面也提到，这对资源损耗很大。所以正常情况下，websocket应该通过一个连接就能完成http多个连接所完成的事情。多个连接应该是在维度上进行区分，比如区分不同会员等级的访问权限。

***所以我们需要对websocket的消息进行管理，使多个组的消息能够通过单独的websocket来进行分流转发。***

对此socket.io进行了封装，实现了***事件监听***、***房间***、***广播***、***多路复用***等功能。

总的来说，socket.io提供了以下几个功能：

- 心跳检测
- 断线重连
- 协议降级
- 事件监听
- 房间
- 广播
- 多路复用

但是还存在一个问题，那就是一个websocket用于少流量的场景还能游刃有余，但如果是高并发场景，一个websocket似乎又有点力不从心，解决方案显然不可能是在同一个服务器上在添加一个websocket连接，因为服务器资源就那么多，即使是开100个websocket连接，也只是在有限的资源池里分蛋糕罢了，并不能解决问题。要切实解决问题就涉及到分布式的知识了，之后的文章或许会有介绍，这里就不过多赘述了。

## socket.io的使用

### socket.io两个端的区分

在使用socket.io之前，我们需要先了解socket.io中有哪些角色：

- 服务端
- 客户端

弄清楚这两个角色是使用好socket.io的关键，因为它们在两端的名称是一致的（虽然可以自己命名），如果不好好的区分，很可能就把自己绕进去了。

~~~ts
//服务端
const io = new Server(httpServer, { /* options */ });
io.on("connection", (socket) => {
  // ...
});


//客户端
const socket = io("https://server-domain.com");
~~~

根据代码我们可以看到，虽然服务端和客户端都是io，但表示的完全不是一个东西，服务器端的io是new Server()的结果，也就是代表实时通信服务器，而客户端的io只是一个连接工具，其会返回一个socket对象。

### socket对象

在socket.io中，每个socket对象就代表着一个连接（这里的连接是不同客户端与服务建立的连接，不是一个客户端能建立多少连接的数量）。研究socket对象，我们可以将两个端的socket对象单独拿出来分析。

- 前端

  前端其实就是一个客户端，而前端中得到的socket对象就代表着其与服务端建立的唯一连接。

- 后端

  也就是服务器，io上监控的connection事件就是客户端请求连接的事件，其回调能拿到与每个客户端建立连接后拿到的连接对象，也就是socket对象。根据函数执行栈，我们很容易想到，每个触发连接事件后所执行的回调都是处于不同的空间中的，也就是每个socket是独立的，这就提供给服务器管理与每个客户端的连接的能力。

根据前面的划分，我们就可以知道socket对象其实是在连接建立后同时存储在前端和后端的对象，但是这两个对象不仅是因为存储的端不同，其作用也会存在区别，这也是容易发生混淆的地方。

就从常用的socket对象方法来说吧，两端的socket对象都拥有on（监听事件）、emit（触发事件）方法，但是它们的作用是完全不同的（或者说正好相反）。

~~~ts
//服务侧socket，写在后端
//根据代码，服务侧socket是存在于连接事件的回调中的
io.on("connection", (socket) => {
  socket.on('anyEvent',()=>{
      socket.emit('anyEvent','anyMsg')
  })
});
~~~

~~~ts
//客户侧socket，写在前端
const socket = io("https://server-domain.com");
socket.on('anyEvent',()=>{
      socket.emit('anyEvent','anyMsg')
})
~~~

从上面的代码上看，是不是感觉很疑惑，客户侧和服务侧几乎一样。

但我们只需要记住***服务侧和客户侧的方法其功能是刚好相反的***就好了。

从上面的案例中，我们可以看到anyEvent方法，虽然看起来一样，但只要记住上面那句话就很好区分了，服务侧socket的on监听的anyEvent是服务侧的anyEvent，而服务侧emit触发的anyEvent是客户侧的anyEvent；对应的服务侧emit的anyEvent会被客户侧的on监听到，而客户侧emit的anyEvent会被服务侧的on监听到。

其实有一个简单的方法让它们看起来不那么复杂，就是命名不同的事件：

~~~ts
//服务侧socket
io.on("connection", (socket) => {
  socket.on('serverEvent',()=>{
      socket.emit('clinetEvent','anyMsg')
  })
});


//客户侧socket
const socket = io("https://server-domain.com");
socket.on('clinetEvent',()=>{
      socket.emit('serverEvent','anyMsg')
})
~~~

但这样我不太喜欢，实际上官方文档也不这么做，具体还是根据自己的喜好。

从上面的案例也可以看到，socket.io可以通过on/emit方法去在单独的连接中随意添加事件，从而达到http多连接的效果，但实际上只是使用一个实时通信连接就完成了，只是在内部进行了相关的格式定义，才能在结果上呈现出这种区分，这是原生的websocket不具备的，这也是我们使用socket.io的原因之一。

### 服务端的一些常用方法

前面讲完socket，实际上关于客户端的socket就这么多，需要提的比较多的还是在服务端。

#### 服务侧socket对象上的一些有用属性

- socket.handshake

  handshake属性可以拿到建立连接的真正请求报文，请求报文上可以拿到token、cookie、ip等信息，所以handshake是比较有用的属性之一。

- socket.data

  data属性是socket上可以进行随意修改其内容的属性，正常来讲socket对象是修改禁止的，但是data是socket对象中开放出来可随意修改的区域，在这里我们就可以存储一些在后续事件中常用的信息，比如用户名、ip、连接时间等。

#### 中间件

和一些常规服务器框架一样，socket.io也提供了中间件的功能，中间件就是能在请求接受过程中进行请求报文的预处理，对于一些在所有请求中逻辑都相同的部分，我们可以提取到中间件中进行统一处理，这样能减少重复代码量。

常见的请求报文预处理情况：

- 用户身份校验
- 垃圾消息过滤
- ......

这里就以token的校验作为例子：

~~~ts
io.use((socket, next) => {
    // 从连接中获取 token
    const token = socket.handshake.auth.token;
    // 验证 token
    if(token){
      jwt.verify(token, privateKey, (err:any, decoded:any) => {
        if (err) {
          return next();
        }
        // 将用户信息添加到 socket 对象
        socket.data.username = decoded.username;
        // 继续连接
        next();
      });
    }else {
      return next();
    }
});
~~~

***在这里我们还需要弄清楚一个问题：中间件是在connetion事件触发前执行的***

比如：

~~~ts
// server-side
io.use((socket, next) => {
  setTimeout(() => {
    // next is called after the client disconnection
    next();
  }, 1000);

  socket.on("disconnect", () => {
    // not triggered
  });
});

io.on("connection", (socket) => {
  // not triggered
});

// client-side
const socket = io();
setTimeout(() => {
  socket.disconnect();
}, 500);
~~~

这里disconnect()是不会发送到服务侧的。

#### 房间

服务器可以将多个socket进行群管理，也就是可以把某些socket划分到某些组，然后它们的通信就可以只存在于组中，不被组外的其他socket监听到。这就类似聊天室的群组功能。

![](.\images\QQ截图20240503171427.png)

~~~ts
io.on("connection", (socket) => {
  socket.join("some room");
  io.to("some room").emit("some event");
});
~~~

#### 命名空间

之前我们也有提到，命名空间就类似http的不同路由功能，实际上就是开辟了一个能提供个客户端建立实时通信连接的途径。

![](.\images\QQ截图20240503171600.png)

~~~ts
//服务端
io.of("/orders").on("connection", (socket) => {
  socket.on("order:list", () => {});
  socket.on("order:create", () => {});
});

io.of("/users").on("connection", (socket) => {
  socket.on("user:list", () => {});
});

//客户端
const orderSocket = io("https://example.com/orders"); // the "orders" namespace
const userSocket = io("https://example.com/users"); // the "users" namespace
~~~

不同命名空间中的执行单元是不同的，归其原因就是socket是不同的，因为是新的连接，也就是类似于emit/on/room都是不同的。

但是不同命名空间可以通过socket的广播功能进行通信，并不像http连接一样每个api是独立的。

#### TS的统一类型管理

前面我们有提到，事件可以通过on/emit随意定义，但是如果软件规模变大，那么事件就会难以控制的增长，最终导致难以维护。

以及服务端的socket.data可以自定，但是其也需要进行管理。

socket.io提供了一个类型管理机制，需要搭配TS完成。

~~~ts
//服务端
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, { /* options */ })

//客户端
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("https://server-domain.com");
~~~

从上面的代码我们可以看到，服务端提供了四个泛型用于管理服务下的各种类型，客户端提供了两个泛型。

这些泛型可以故名思意，我就不多提了。

具体用法参考：

~~~ts
export interface ServerToClientEvents {
  event1: (msg: Msg) => void;
  event2: (param: { username: string; isOnline: boolean }) => void;
  event3: (msg: {
    success: boolean;
    likes: number;
    msgId: string;
    room: string;
  }) => void;
}
~~~

#### socket配置只使用websocket

~~~ts
//服务端
const io = new Server(httpsServer,{
  transports: [ "websocket" ] // or [ "websocket", "polling" ] (the order matters)
});

//客户端
const socket = io("https://www.example.com", {
  // WARNING: in that case, there is no fallback to long-polling
  transports: [ "websocket" ] // or [ "websocket", "polling" ] (the order matters)
});
~~~

### 代理以及跨域问题

一般情况下，后端服务和前端都是跨域的，所以我们需要考虑跨域问题。

#### 开发环境下

一般有几种情况：

- 如果前端不想配代理，那么由后端配cors：

  ~~~ts
  //后端
  const io = new Server(httpServer, {
    cors: {
      //需要为前端服务域名
      origin: "https://example.com",
      allowedHeaders: ["my-custom-header"],
      //表示启动ssl加密，这个只有在https或wss的情况下才开启
      credentials: true
    }
  });
  ~~~

- 或者后端不配置，前端配代理（以vite为例）：

  ~~~ts
  //前端
  io('/', {
     withCredentials: true,
     path: '/socket.io/',
  });
  ~~~

  ~~~ts
  //vite.config.ts
  export default defineConfig({
      server: {
          proxy: {
              '/socket.io/':{
                  //因为是开发环境，所以证书一般是假的，这时就需要关闭secure
                  secure: false,
                  //后端服务地址
          		target: 'https://example.com:4000',
          		changeOrigin: true,
              }
          }
      }
  })
  ~~~

不过为了安全考虑，一般会选择在后端进行配置，因为后端的cors通过地址如果允许所有域名都通过，是存在很大安全问题的，一般是设置到只允许自己的前端服务的域名。

> 关于cors和同源策略就多说一点，有些人可能很奇怪为什么在后端设置了个cors就可以通过同源策略了，那同源策略的意义何在？
>
> ***实际上同源策略并不是保护前端的，而是保护后端的。***
>
> 同源策略的初衷是防止xss和csrf攻击，这两个攻击都是利用前端脚本去对服务器发送恶意请求，从而获取私密数据，那么我们就需要过滤这些不法的请求，比较有效的做法就是服务器只接受自己承认的请求，比如：
>
> - 同源，也就是通过nginx反向代理到的后端服务就是安全的
> - 或者说服务器配置cors指定域名
>
> 其实只要弄清同源策略的保护对象就不难理解，很多人都误会它是保护前端的了，实际上前端有什么好保护的？

#### 生产环境下

理论上来说，前端通过nginx反向代理，或者后端设置cors升级服务就可以实现跨域，与开发环境区别不大，但还是会有一些其他小坑，比如如果想要利用websocket来进行通信，就需要配置nginx的升级服务，如果不配置升级服务虽然说socket.io会自动降级至长轮询，但是这是万不得已的情况才使用的。

下面来讲一讲nginx的升级服务：

~~~ts
http {
  server {
    listen 80;
    server_name example.com;

    location /socket.io/ {
      //配置这个可以得到原始的请求ip，因为反向代理对于服务器来说是只和nginx做交道，不知道客户端是谁的
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      //原始请求域名转发，与获取ip同理，不配置服务器就是摸黑，不利于cors
      //这常常会成为一个坑，就是后端配置了cors，却没配置这个，那么就无法连接成功
      proxy_set_header Host $host;

      proxy_pass http://localhost:4000;

      //websocket升级服务
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
~~~

## 结语

上面就是关于socket.io的一些常规使用知识，知道这些知识或许就可以搭建一个功能齐全的实时通信软件了，但是如果涉及到软件的性能、抗压性等方面还是远远不够的，socket提供了许多性能方面的优化途径：适配器（分布式）、自定义解析器、服务器文件负载修改。这些或许会在后续的文章中进行描述，敬请期待~~~

## 参考

[socket.io官方文档](https://socket.io/zh-CN/docs/v4/performance-tuning/)



