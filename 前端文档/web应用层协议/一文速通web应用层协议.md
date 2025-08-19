### 导读

作为web程序员，经常和应用层协议打交道，但大多时候，我们只是使用编程语言提供好的接口，知其然但不知其所然。本篇文章针对这一痛点，带读者速通常见的web应用层协议的实现原理及一些基本的使用方法，协议包括HTTP/1.1、HTTP/2、HTTP/3、HTTPS、WebSocket，还有基于HTTP的流式传输等等。

### HTTP

#### HTTP/1.1

HTTP/1.1是我们打过交道最多的应用层协议，本篇文章将讲述关于HTTP/1.1的以下几个知识：

- 状态码
- 内容编码
- 缓存策略
- 连接管理

##### 状态码

| 状态码         | 含义                                                         |
| -------------- | ------------------------------------------------------------ |
| **通知**       |                                                              |
| 100            | 表示已收到请求的初始部分，并且尚未被服务器拒绝。该服务器打算在完全收到并采取该请求后发送最终响应 |
| **101**        | 协议替换或升级                                               |
| **成功**       |                                                              |
| **200**        | 请求成功                                                     |
| **201**        | 请求成功，资源已创建，常用于 POST（如上传文件）              |
| 202            | 表明该请求已被接受用于处理，但是处理尚未完成                 |
| 203            | 服务器已成功处理请求，但返回的元数据（headers）不是源服务器的原始信息，也就是走了代理 |
| **204**        | 请求成功，但无返回内容，常用于 DELETE                        |
| 205            | 请求成功，客户端应重置当前视图/表单内容（即清空填写的内容）  |
| 206            | 表示服务器通过传输所选表示的一个或多个部分来成功满足目标资源的范围请求 |
| **重定向**     |                                                              |
| 300            | 服务器希望用户代理参与谈判，以为其需求选择最合适的资源获取形式 |
| **301**        | 永久性移动                                                   |
| **302**        | 临时性移动                                                   |
| 303            | 指示服务器将用户代理重定向到另一个资源                       |
| **304**        | 服务器确认缓存资源有效，用户从缓存获取资源                   |
| 307            | 临时性重定向                                                 |
| 308            | 永久性重定向                                                 |
| **客户端错误** |                                                              |
| **400**        | 请求格式错误、参数无效                                       |
| **401**        | 身份验证失效                                                 |
| **403**        | 权限不足，禁止访问                                           |
| **404**        | 资源未找到                                                   |
| **405**        | 方法不被允许                                                 |
| 406            | 服务器能产生响应内容，但无法满足客户端请求中指定的 Accept 头部条件。 |
| 407            | 代理身份验证失效                                             |
| 408            | 请求超时                                                     |
| 409            | 请求冲突，通常发生在PUT请求中                                |
| 410            | 目标服务器不再有该资源                                       |
| 411            | 内容长度未定义                                               |
| 412            | 客户端在请求中设定的前提条件（Precondition）未被服务器满足，所以请求失败，比如`If-Match` |
| 413            | 内容太大                                                     |
| 414            | URI过长                                                      |
| 415            | 不支持的媒体类型                                             |
| 416            | 范围请求时，范围无法满足                                     |
| 417            | 服务器无法满足客户端在请求中通过 `Expect` 头设置的期望条件   |
| 421            | 这个请求被发给了一个错误的服务器，该服务器无法响应它         |
| 422            | 无法处理的内容，可能内容存在语法错误，比如服务器知道处理的是XML，但是内容中XML的语法错误 |
| 426            | 协议需要被升级                                               |
| **服务器错误** |                                                              |
| **500**        | 服务器内部错误                                               |
| 501            | 服务器无法识别请求方法                                       |
| **502**        | 错误的网关，网关/代理收到了无效响应（上游服务挂了）          |
| **503**        | 服务不可用                                                   |
| **504**        | 网关超时，请求到上游服务超时了（常见于微服务）               |
| 505            | 不支持的HTTP版本                                             |

##### 内容编码

内容编码字段是一个非常有用的字段，它定义了消息体的编码解码方式，通常这样的编码算法为压缩算法，也就是说，通过使用内容编码，我们可以减少传输内容的体积，从而提高传输速度，这也是前端优化的一个手段之一。

具体来说，内容编码定义在这个字段下：

~~~
Content-Encoding = #content-coding
~~~

与其说是HTTP提供了内容编码这个功能，更不如说是HTTP提供了这个标准，而具体的编码实现还是需要HTTP服务代理去进行处理，体现在具体应用中就是用户代理（浏览器）、服务器代理（nginx）的HTTP实现层需要进行编码解码的实现。

目前已经注册过的编码算法有:

| Name         | Description                                                  | Reference                                                    | Notes           |
| :----------- | :----------------------------------------------------------- | :----------------------------------------------------------- | :-------------- |
| aes128gcm    | 使用 128 位内容加密密钥的 AES-GCM 加密                       | [[RFC8188](https://www.iana.org/go/rfc8188)]                 |                 |
| **br**       | Brotli 压缩数据格式                                          | [[RFC7932](https://www.iana.org/go/rfc7932)]                 |                 |
| compress     | UNIX "compress" data format [Welch, T., "A Technique for High Performance Data Compression", IEEE Computer 17(6), June 1984.] | [[RFC9110](https://www.iana.org/go/rfc9110)]                 | Section 8.4.1.1 |
| dcb          | Dictionary-Compressed Brotli                                 | [[RFC-ietf-httpbis-compression-dictionary-19](https://www.iana.org/go/draft-ietf-httpbis-compression-dictionary-19)] | Section 4       |
| dcz          | Dictionary-Compressed Zstandard                              | [[RFC-ietf-httpbis-compression-dictionary-19](https://www.iana.org/go/draft-ietf-httpbis-compression-dictionary-19)] | Section 5       |
| deflate      | "deflate" compressed data ([[RFC1951](https://www.iana.org/go/rfc1951)]) inside the "zlib" data format ([[RFC1950](https://www.iana.org/go/rfc1950)]) | [[RFC9110](https://www.iana.org/go/rfc9110)]                 | Section 8.4.1.2 |
| exi          | W3C 有效 XML 交换标准                                        | [[W3C Recommendation: Efficient XML Interchange (EXI) Format](http://www.w3.org/TR/exi/)] |                 |
| **gzip**     | GZIP file format [[RFC1952](https://www.iana.org/go/rfc1952)] | [[RFC9110](https://www.iana.org/go/rfc9110)]                 | Section 8.4.1.3 |
| **identity** | 不编码                                                       | [[RFC9110](https://www.iana.org/go/rfc9110)]                 | Section 12.5.3  |
| pack200-gzip | Java 资源文件的网络传输格式                                  | [[JSR 200: Network Transfer Format for Java](http://www.jcp.org/en/jsr/detail?id=200)][[Kumar_Srinivasan](https://www.iana.org/assignments/http-parameters/http-parameters.xhtml#Kumar_Srinivasan)][[John_Rose](https://www.iana.org/assignments/http-parameters/http-parameters.xhtml#John_Rose)] |                 |
| x-compress   | compress的别名                                               | [[RFC9110](https://www.iana.org/go/rfc9110)]                 | Section 8.4.1.1 |
| x-gzip       | gzip的别名                                                   | [[RFC9110](https://www.iana.org/go/rfc9110)]                 | Section 8.4.1.3 |
| zstd         | 使用 Zstandard 协议压缩的字节流，其窗口大小不超过 8MB        | [[RFC9659](https://www.iana.org/go/rfc9659)][[RFC8878](https://www.iana.org/go/rfc8878)] |                 |

如果我们需要进行内容压缩，具体的流程如下：

首先由客户端发送请求，此时用户代理（浏览器）将会对我的的请求进行封装，添加请求头字段：

~~~sh
# 格式
Accept-Encoding  = #( codings [ weight ] )
codings          = content-coding / "identity" / "*"

# 实例
# 表示只接受compress,gzip
Accept-Encoding: compress, gzip
# 表示接受所有编码
Accept-Encoding:
Accept-Encoding: *
# q为权重，权重越高，表示更希望该编码
Accept-Encoding: compress;q=0.5, gzip;q=1.0
# identity被用作无编码的同义词，以便在首选不编码时进行通信
Accept-Encoding: gzip;q=1.0, identity; q=0.5, *;q=0
~~~

一般这个字段不需要用户进行修改，其实想想能够理解，HTTP层的解码是浏览器内部实现的，根据浏览器的版本不同，可能支持的解码算法不同，不应该由用户接触到解码的细节。

接下来服务器收到请求后，如果用户提的编码要求服务器不满足，则会返回**415**状态码，如果支持则会添加该响应头字段：

~~~sh
# 格式
Content-Encoding = #content-coding

# 实例
Content-Encoding: gzip
~~~

这就表示，服务器已经根据编码算法注册表中的**gzip**算法对内容进行编码了，用户代理接收到这样的响应头后就会利用**gzip**算法对响应体进行解码，然后再转交给用户。

##### 缓存策略

缓存策略中分为强缓存、协商缓存。

- 强缓存

  指的是根据响应头返回的一些特殊字段，未来再请求该路径，用户代理会进行处理，直接走缓存，而不会将请求再发出。

  关于缓存的字段主要有：

  ~~~sh
  Age = delta-seconds
  Cache-Control = #cache-directive
  Expires = HTTP-date
  ~~~

  - Age的计算

    Age指的是资源从服务器生成到当前的时间。这个字段通常是由缓存服务器设置的。缓存服务器计算age的流程：

    ~~~sh
    # date_value：响应头里的 Date 时间（资源生成的时间）
    # response_time：缓存服务器收到响应的时间
    # apparent_age：这个响应看起来至少已经这么老了
    apparent_age = max(0, response_time - date_value);
    
    # request_time：缓存服务器发出请求的时间
    # response_delay：请求花了多少时间
    response_delay = response_time - request_time;
    
    # age_value：响应头里 Age 字段的值（如果有）
    # corrected_age_value：考虑网络延迟后，对 Age 的修正
    corrected_age_value = age_value + response_delay;
    
    corrected_initial_age = max(apparent_age, corrected_age_value);
    # resident_time：资源在缓存服务器中停留的时间
    resident_time = now - response_time;
    
    # current_age：现在（当前时刻）资源的实际年龄
    current_age = corrected_initial_age + resident_time;
    # age设置为current_age
    ~~~

  - Cache-Control

    Cache-Control在客户端和服务器都可以设置，客户端设置被称为**请求指令**，服务器设置被称为**响应指令**。请求指令只是用于请求服务器如何进行处理，不具备决定性，而**响应指令**则是告知服务器如何处理。下面是Cache-Control可填写的值及其含义：

    | 指令             | 类型        | 说明                                                         |
    | ---------------- | ----------- | ------------------------------------------------------------ |
    | **no-cache**     | 请求 / 响应 | 强制进行协商缓存，不直接使用缓存（响应中生效）               |
    | **no-store**     | 请求 / 响应 | 禁止任何缓存                                                 |
    | **max-age=秒数** | 请求 / 响应 | 指定资源最多可以缓存多久（相对时间）                         |
    | only-if-cached   | 请求        | 只使用缓存，如果没有缓存就失败（通常用于离线模式）           |
    | max-stale=秒数   | 请求        | 即使资源已经过期，只要没有过期太久，我也愿意接受它           |
    | min-fresh=秒数   | 请求        | 只接受还能在未来保持新鲜状态至少 n 秒（max-age - age > n）的缓存资源。否则请重新请求服务器获取新资源 |
    | no-transform     | 请求 / 响应 | 禁止代理压缩、图像降质等转换操作                             |
    | s-maxage=秒数    | 响应        | 给共享缓存（如 CDN）用的 max-age，优先生效                   |
    | private          | 响应        | 只能被私有缓存（如浏览器）缓存，CDN 不缓存                   |
    | public           | 响应        | 可被任何缓存（浏览器、代理、CDN）存储                        |
    | must-revalidate  | 响应        | 资源过期后，必须向服务器验证，不能使用过期缓存               |
    | proxy-revalidate | 响应        | 与上类似，仅用于代理缓存                                     |

  - Expires

    Expires是在HTTP/1.0时用于进行强缓存的字段，通常设置的值为一个绝对时间，但是由于服务器和客户端的时钟不一定保持一致，所以这个方案已经在HTTP/1.1被Age+Cache-Control替代，这里就不过多介绍了。

  当强缓存确认过期后，我们向服务器发送新的请求，这时会先走协商缓存（当然前提是`Cache-Control`不为`no-store`）。

- 协商缓存

  简单来说就是客户端发送**条件请求**，服务端进行比较，如果服务端的数据没变，那就走缓存。

  首先我们来看一看**条件请求**，也就是在请求头中的几个特殊字段：

  | 字段格式                              | 示例                                               | 含义                                                         | 适用方法   |
  | ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------ | ---------- |
  | If-Match = "*" / #entity-tag          | If-Match: "xyzzy"                                  | 将Etag发送给服务器，服务器用于判断资源是否**已修改**（用于安全更新） | PUT\DELETE |
  | **If-None-Match = "*" / #entity-tag** | If-None-Match: "xyzzy"                             | 将Etag发送给服务器，服务器用于判断资源是否**未修改**（用于资源获取） | GET        |
  | **If-Modified-Since = HTTP-date**     | If-Modified-Since: Sat, 29 Oct 1994 19:43:31 GMT   | 将最后修改时间发送给服务器，服务器用于判断是否**已修改**（用于资源获取） | GET        |
  | If-Unmodified-Since = HTTP-date       | If-Unmodified-Since: Sat, 29 Oct 1994 19:43:31 GMT | 将最后修改时间发送给服务器，服务器用于判断资源是否**未修改**（用于安全更新） | PUT/DELETE |

  我们来看一下条件的比较规则：

  ~~~ts
  procedure1(){
  	if(If-Match){
  	    procedure3()
  	}else {
  	    return 412
  	}
  }
  
  procedure2(){
      if(If-Unmodified-Since){
  	    procedure3()
  	}else{
  	    return 412
  	}
  }
  
  procedure3(){
      if(If-None-Match){
          procedure5()
      }else if(request.method==='GET'){
          return 304
      }else {
          return 412
      }
  }
  
  procedure4(){
      if(If-Modified-Since){
          procedure5()
      }else{
          return 304
      }
  }
  
  procedure5(){
      // 处理if-range
      // 暂时不提
  }
  
  // 简单来说，有ETag，比较ETag，没ETag，比较HTTP-date
  ~~~

  现在看完了条件请求，读者会有疑惑，ETag和HTTP-date是哪来的？接下来我们看的响应头字段将会作为解答：

  ~~~sh
  # 格式
  Last-Modified = HTTP-date
  # 实例
  Last-Modified: Tue, 15 Nov 1994 12:45:26 GMT
  
  # 格式
  ETag = entity-tag
  # 实例
  ETag: "xyzzy"
  ~~~

  作为服务器，会在响应里适当的更新以上两个字段，而条件请求则以此获取到ETag和HTTP-date。

  现在的问题是，服务器如何生成这些东西呢？服务器是根据什么来判断请求内容是否有改变的？

  这个需要区分静态资源和动态资源，如果说是动态资源，需要服务器开发人员去手动的设置，而静态资源我们可以通过服务器代理去自动设置，比如如果我们使用的是Nginx，可以通过配置：

  ~~~sh
  etag on;
  ~~~

  此时静态文件就会在每次发送时进行nginx内部算法的一个计算，获取etag放入响应头，而HTTP-date则是默认设置的，nginx通常根据静态文件在主机上的修改时间去进行设置。

  HTTP还给服务器比较ETag或HTTP-date设置了**强比较**和**弱比较**的规则，大概规则如下：

  | 类型    | 格式         | 含义                                     |
  | ------- | ------------ | ---------------------------------------- |
  | 强 ETag | `"abc123"`   | 精确匹配字节完全相同                     |
  | 弱 ETag | `W/"abc123"` | 内容大体相同即可，允许轻微变化（如换行） |

  有的读者可能会有疑问，我既然都把请求发送到服务器了，服务器直接把数据发回给我不就好了？为什么还让我再去请求缓存服务器，这不是又多了一个请求链吗？

  这里可以考虑一下假设我的数据文件很大，这时如果我们通过缓存获取，假设缓存获取的延迟是从服务器获取的10%，那么我们新的延时为：

  `服务器协商延迟 + 0.1 * 数据获取延迟`

  我们做一个等式：

  `服务器协商延迟 + 0.1 * 数据获取延迟 < 数据获取延迟`

  这时如果我们的数据大到一定程度，走缓存都是不错的选择。

下面是缓存策略的流程图：

只走协商缓存：

![](.\images\Snipaste_2025-07-30_14-31-17.jpg)

既走强缓存也走协商缓存：

![](.\images\Snipaste_2025-07-30_14-31-45.jpg)

图上本地缓存实际上就是用户代理，只是为了便于绘制流程图，才将其拆开。

##### 连接管理

消息头连接字段格式：

~~~sh
Connection        = 1#connection-option
connection-option = token
~~~

- 持久性

  HTTP/1.1默认使用持续连接，并且允许在单个连接（TCP连接）上携带多个请求和响应，但是要**注意一点**：HTTP/1.1的请求是串行的，也就是一个请求响应完了才发送下一个请求，这也是为什么会再开发pipelining（虽然被弃用）。

  只有当`Connection: close`时才关闭连接。

  持续连接相当于HTTP/1.0版本中的`Connection: keep-alive`，但是在此基础上支持了单连接多请求的功能。

- 管道（pipelining）

  支持持续连接的客户端可以“pipelining”其请求（即，在不等待每个响应的情况下发送多个请求）。如果服务器有安全的方法，则可以并行处理一系列管道请求的序列，但是它必须以接收请求的**相同顺序发送相应的响应**。

  服务器需要按照相同顺序进行响应就会带来一个巨大的问题——**队头阻塞**，如果第一个请求传输的慢，那么后面的请求都将被阻塞。

- 并发

  指的是客户端启多个端口去建立TCP连接。

以上三点就是HTTP/1.1实现的**伪多路复用**，在现实中管道已经被弃用了，因为队头阻塞是个很大的问题，而持久性和并发对性能的提升也非常有限，所以说是**伪**的。

#### HTTP/2

针对HTTP/1.1现存的问题，HTTP/2做了以下改进：

- 消息帧，二进制化
- 多路复用改进，优化队头阻塞
- 流量控制
- 优先级
- 服务器推送
- 头部压缩算法（HPACK）

##### 消息帧

HTTP/2的帧格式如下：

```yaml
HTTP Frame {
  # Frame Payload的大小，一般最大为2^14
  Length (24),
  # 帧类型
  Type (8),  
  # 一个针对特定于Frame类型的布尔标志的8位字段。
  Flags (8),  
  # 保留字段，未定义，通常被忽略
  Reserved (1),
  # 无符号的31位整数，流标识符
  Stream Identifier (31),
  # 数据
  Frame Payload (..),
}
```

也就是说每个帧都有固定9个字节（(24 + 8 + 8 + 1 + 31) / 8 = 9）的标头。

HTTP Frame完全是二进制化的，上面定义的结构在真实场景中是这样的：

~~~yaml
00 00 12      ← Length: 24 bytes
01            ← Type: HEADERS
05            ← Flags: END_HEADERS + END_STREAM
00 00 00 01   ← Stream ID: 1
...payload：经过HPACK压缩的头部字段（全是二进制）
~~~

HTTP Frame有以下几种：

- DATA Frame

  `type=0x00` ，发送实际的 HTTP 响应/请求内容（如 HTML、JSON）。可用于任意流。

  ```
  DATA Frame {
    Length (24),
    
    Type (8) = 0x00,  
    
    Unused Flags (4),
    PADDED Flag (1),
    Unused Flags (2),
    END_STREAM Flag (1),  
    
    Reserved (1),
    
    Stream Identifier (31),  
    
    [Pad Length (8)],
    Data (..),
    Padding (..2040),
  }
  ```

- HEADERS Frame

  `type=0x01` ，发送 HTTP 首部（请求头/响应头）。包含压缩的头部字段。

  ```
  HEADERS Frame {
    Length (24),
    
    Type (8) = 0x01,  
    
    Unused Flags (2),
    PRIORITY Flag (1),
    Unused Flag (1),
    PADDED Flag (1),
    END_HEADERS Flag (1),
    Unused Flag (1),
    END_STREAM Flag (1),  
    
    Reserved (1),
    
    Stream Identifier (31),  
    
    [Pad Length (8)],
    [Exclusive (1)],
    [Stream Dependency (31)],
    [Weight (8)],
    Field Block Fragment (..),
    Padding (..2040),
  }
  ```

- PRIORITY Frame

  `type=0x02` ，指定流的优先级，告诉对方当前流的重要性及依赖关系。

  ```
  PRIORITY Frame {
    Length (24) = 0x05,
    
    Type (8) = 0x02,  
    
    Unused Flags (8),  
    
    Reserved (1),
    
    Stream Identifier (31),  
    
    Exclusive (1),
    Stream Dependency (31),
    Weight (8),
  }
  ```

- RST_STREAM Frame

  `type=0x03` ，强制中断一个 stream，表示该流终止，通常用于错误处理。

  ```
  RST_STREAM Frame {
    Length (24) = 0x04,
    
    Type (8) = 0x03,  
    
    Unused Flags (8),  
    
    Reserved (1),
    
    Stream Identifier (31),  
    
    Error Code (32),
  }
  ```

- SETTING Frame

  `type=0x04` ，通信双方交换配置参数，如最大流数、窗口大小等。只能在 stream 0 中发送。

  ```
  SETTINGS Frame {
    Length (24),
    
    Type (8) = 0x04,  
    
    Unused Flags (7),
    ACK Flag (1),  
    
    Reserved (1),
    
    Stream Identifier (31) = 0,  
    
    Setting (48) ...,
  }
  
  Setting {
    Identifier (16),
    Value (32),
  }
  ```

- PUSH_PROMISE Frame

  `type=0x05` ，服务器预先推送资源给客户端（Server Push）。

  ~~~
  PUSH_PROMISE Frame {
    Length (24),
    
    Type (8) = 0x05,
    
    Unused Flags (4),
    PADDED Flag (1),
    END_HEADERS Flag (1),
    Unused Flags (2),
    
    Reserved (1),
    
    Stream Identifier (31),
    
    [Pad Length (8)],
    Reserved (1),
    Promised Stream ID (31),
    Field Block Fragment (..),
    Padding (..2040),
  }
  ~~~

- PING Frame

  `type=0x06` ，用于心跳检测，计算 RTT（往返时延）。也可用于探测连接是否还活着。

  ~~~
  PING Frame {
    Length (24) = 0x08,
    
    Type (8) = 0x06,
    
    Unused Flags (7),
    ACK Flag (1),
    
    Reserved (1),
    
    Stream Identifier (31) = 0,
    
    Opaque Data (64),
  }
  ~~~

- GOAWAY Frame

  `type=0x07` ，通知对方：我不再接受新的流（如准备关闭连接）。

  ~~~
  GOAWAY Frame {
    Length (24),
    
    Type (8) = 0x07,
    
    Unused Flags (8),
    
    Reserved (1),
    
    Stream Identifier (31) = 0,
    
    Reserved (1),
    Last-Stream-ID (31),
    Error Code (32),
    Additional Debug Data (..),
  }
  ~~~

- WINDOW_UPDATE Frame

  `type=0x08` ，实现流量控制，用于更新对方的窗口大小。

  ~~~
  WINDOW_UPDATE Frame {
    Length (24) = 0x04,
    
    Type (8) = 0x08,
    
    Unused Flags (8),
    
    Reserved (1),
    
    Stream Identifier (31),
    
    Reserved (1),
    Window Size Increment (31),
  }
  ~~~

- CONTINUATION Frame

  `type=0x09` ，当 HEADERS 或 PUSH_PROMISE 太大拆成多帧时，用此帧继续传输剩余头部。

  ~~~
  CONTINUATION Frame {
    Length (24),
    
    Type (8) = 0x09,
    
    Unused Flags (5),
    END_HEADERS Flag (1),
    Unused Flags (2),
    
    Reserved (1),
    
    Stream Identifier (31),
    
    Field Block Fragment (..),
  }
  ~~~

下面我们简单的将HTTP/2和HTTP/1.1的帧做个对比：

**简单的请求**：

其中HTTP/2的flag利用+/-来表示值。

~~~sh
  GET /resource HTTP/1.1           HEADERS
  Host: example.org          ==>     + END_STREAM
  Accept: image/jpeg                 + END_HEADERS
                                       :method = GET
                                       :scheme = https
                                       :authority = example.org
                                       :path = /resource
                                       host = example.org
                                       accept = image/jpeg
~~~

**简单的响应**：

~~~sh
  HTTP/1.1 304 Not Modified        HEADERS
  ETag: "xyzzy"              ==>     + END_STREAM
  Expires: Thu, 23 Jan ...           + END_HEADERS
                                       :status = 304
                                       etag = "xyzzy"
                                       expires = Thu, 23 Jan ...
~~~

##### 多路复用

HTTP/2的多路复用实际上就是**流（stream）**的使用，**流的含义**是HTTP/2连接中 客户端和服务端 之间 用于帧交换的 **独立双向序列**。下面是流的一些重要特性：

- 单个HTTP/2连接可以建立多个流，也就是一个端点可以建立多个流，而不同流的帧能在这个连接中传输且互不干扰。
- 流可以单方面建立和使用，也可以由任何端点共享。
- 流可以通过任一端点关闭。
- 发送帧的顺序很重要。接收者按照收到的顺序处理帧。特别是，头帧（Headers）和数据帧（Data）的顺序在语义上是显着的。
- 流由整数标识。启动流的端点分配流标识符（Stream Identifier）给流。

**流的生命周期**如下图：

![](.\images\Snipaste_2025-07-31_15-40-51.jpg)

> 流程语义：
>
> - send：端点发送此帧
> - recv：端点接收此帧
> - H：HEADERS帧（带有隐含的CONTINUATION帧）
> - ES：END_STREAM flag
> - R：RST_STREAM帧
> - PP：PUSH_PROMISE帧（带有隐含的CONTINUATION帧）

> 流状态：
>
> - idle：初始状态，从未使用过的 stream
> - reserved(local)： 表示当前 stream 被本端保留但尚未使用
> - reserved(remote)：远程保留，收到对方 PUSH_PROMISE 但未接收数据
> - open：双方都可以发送帧
> - half-closed (local)：本地已发送完毕，对方还可以发送
> - half-closed (remote)：对方已发送完毕，本地还可以发送
> - closed：流完全关闭，不再传输
>
> 以上状态由客户端/服务器代理，不由frame携带

从上面的状态机我们可以看到，从流的打开到关闭所用的帧都属于一个请求，所以我们可以想象，**HTTP/2的流就是一个请求处理的过程**。

**流标识符的设置规则**：

- 流标识符为无符号31位整数。**客户端**发起的流必须使用**奇数**流标识符；**服务器**发起的流必须使用**偶数**的流标识符。零（0x00）的流标识符用于连接控制消息，不能用于建立新的流。

- 新建立的流标识符在**数值**上必须大于启动端点**已经打开或保留的所有流**（一个连接中最大）；

  这在使用HEADERS帧和使用PUSH_PROMISE帧打开的流中都生效；

  接收不符合以上规则的流标识符的端点必须用`ERROR CODE`为`PROTOCOL_ERROR`的帧（RST_STREAM或GOAWAY）响应错误。

- 流标识符无法重复使用，长寿命的连接可能会导致端点耗尽了流标识符的可用范围；

  无法建立新流标识符的客户端可以为新流建立新连接，无法建立新的流标识符的服务器可以发送GOAWAY帧，以便客户被迫为新流的新连接打开新连接。

**流并发数的设置**：

- 流对等端点双方都可以在SETTING帧中设置settings_max_concurrent_streams限制**一个连接**中最多能建立的流的数量；

  但是只能互相给对方设置，比如客户端指定服务器可以启动的最大并发流数量，服务器指定客户端可以启动的最大并发流数。

- 此设置适用于open、half-closed (local)、half-closed (remote)状态的流，也就是这些状态的流都参与计数。

- 端点不能超过其对等方设置的限制。超出后对等方将用`ERROR CODE`为`PROTOCOL_ERROR`或`REFUSED_STREAM`的帧（RST_STREAM或GOAWAY）响应错误。

读到这里相信读者应该都对HTTP/2的多路复用有了一个比较清晰的认识，我这里再简单做个**小结**：

HTTP/2的多路复用，其中**多路**指的是**多个流**，**复用**指的是**复用一个连接**，也就是一个连接可以建立多个流（请求），这些**流之间**是处于一个**并发**的状态的，但是**流内部**的帧必须是**串行**的，这一点一定要弄清楚。

多路复用我们弄清楚了，现在我们来看HTTP/2对于**队头阻塞**的优化：

在HTTP/2中一个连接可以有多个并行的流（请求），即使一个流阻塞了，其它流也不会受到影响，这就是其优化。下面我们来看看HTTP/1.1和HTTP/2的对比：

| 特性                              | HTTP/1.1                             | HTTP/2                                            |
| --------------------------------- | ------------------------------------ | ------------------------------------------------- |
| 多路复用                          | ❌ 不支持（请求串行）                 | ✅ 支持（请求并行，帧交错）                        |
| 每个连接可并发请求数              | 通常**1 个**（长连接串行）           | 通常**成百上千个 stream**（一个连接并发多个请求） |
| 队头阻塞（Head-of-Line Blocking） | ❌ 严重：前一个请求未完成，下一个卡住 | ✅ 已解决：一个请求慢不会卡其他                    |
| 请求复用机制                      | 一个连接同时只能处理一个请求         | 一个连接中的多个 stream 可以交错传输帧            |
| 帧机制                            | 基于文本请求/响应报文                | 请求/响应被拆成二进制帧，按 stream 编号交错发送   |
| 典型优化手段                      | 需要多个 TCP 连接并发                | 一个 TCP 连接就能并发所有请求                     |

**HTTP/1.1的请求图：**

请求2需等待请求1响应后才能发送。

![](.\images\Snipaste_2025-08-01_08-41-32.jpg)

**HTTP/2的请求图:**

请求并发发送。

![](.\images\Snipaste_2025-08-01_08-47-23.jpg)

##### 流量控制

从上一小节多路复用看到，我们可以创建多个流，尽情的使用请求并发，但在**TCP层**仍然存在**拥塞控制**，这使得如果我们不控制消息发送的频率，就会在TCP层造成堵塞，HTTP/2针对这一点也做了一定的处理：

- 流量控制以**连接**为单位，流量控制只在单个hop间起作用，而不是贯穿整个连接，比如：

  ~~~sh
  [客户端] → [CDN/代理] → [源服务器]
               ↑   单个hop	 ↑
  ~~~

- 流量控制基于`WINDOW_UPDATE`帧，该帧定义了流量窗口的大小

- 流量控制是定向的，也就是收发两端的窗口大小可以不一致。接收器可以为每个流设置窗口大小，也可以为整个连接设置窗口大小，当然只能设置接收器一端

- 对于新流和整体连接，流量控制窗口的初始值为65,535字节

- 只有数据帧可以进行流量控制；因为所有其他类型的帧都不会在流量控制窗口中消耗空间。这样可以确保重要的控制帧不会被流控制阻止

- 端点可以选择禁用其自身的流量控制，但是端点不能忽略其对等方的流量控制信号

##### 优先级

在诸如HTTP/2之类的多路复用协议中，将带宽和计算资源分配给流对取得良好的性能至关重要。优先级差的方案可能会导致HTTP/2的性能变差，甚至不如HTTP/1.1。

我们在前文HTTP/2的请求图中看到服务器的响应流之间可以不按顺序，这其实就是通过优先级控制的，多路复用实际上就是单线程事件驱动（一般情况），来一个帧触发处理事件，然后执行回调，如果某个帧处理出现阻塞，就会阻断后面帧的处理，这时候降低耗时的帧的优先级，让处理更快的帧先处理，就会提升请求性能。

在HTTP/2中并没有限制服务器如何实现优先级算法，所以服务器可以根据自己的需求去设计优先级算法。

##### 服务器推送

HTTP/2允许服务器先发制地将（或“推送”）响应（以及相应的“promised”请求）发送给**先前进行client-initiated request过的客户端**。**先前进行client-initiated request过的客户端**很重要，也就是需要由客户端先建立请求，服务器再根据这个请求的上下问进行推送，而不是任意的进行推送，比如：

> GET /index.html  ← 这是一个 client-initiated request
>
> 服务器响应页面的同时发送：
>
> - 一个 PUSH_PROMISE（表示：我猜你要 /style.css）
> - 然后推送 /style.css 的 HEADERS + DATA 帧

但是这似乎和**流的生命周期**图中描述的情况有冲突，在该图中，流处于`idle`状态，此时客户端明明没有发送连接请求，为什么服务器还能推送`PUSH_PROMISE`？这是一个很容易被误导的点，其具体的工作流是这样的：

- 客户端在`stream1`发送了一个初始请求
- 服务器在`stream1`发送了一个响应
- 服务器建立`stream2`发送`PUSH_PROMISE`

服务器基于客户端的`client-initiated request`进行推送，但是推送的路径并不是原来的流。

现在我们知道服务器推送是怎么工作的了，但是服务器即使推送了，客户端没有对推送的资源进行请求时，是用不到该资源的，等用到的时候再进行请求时，难道服务器还要再推一遍吗？很多读者都会想到，也许用户代理做了缓存。确实，要实现服务器推送就需要用户代理进行支持，做缓存，但是如果服务器是一个不怀好意的服务器，他如果不断地推送资源怎么办呢？用户代理就需要针对这种情况进行处理。

客户端也可以发送设置了`settings_enable_push: 0`的`SETTING`帧去关闭服务器推送。

##### HPACK

HTTP/2的头部压缩指的是对**HEADERS帧的payload**进行压缩。

HPACK里有几个重要的实体：

- **静态表**，只读，定义了常见的头字段索引

- **动态表**，先进先出表，如果存的内容超出表大小则将老条目驱逐，会和静态表形成联合索引空间

  ~~~
  <----------  Index Address Space ---------->
  <-- Static  Table -->  <-- Dynamic Table -->
  +---+-----------+---+  +---+-----------+---+
  | 1 |    ...    | s |  |s+1|    ...    |s+k|
  +---+-----------+---+  +---+-----------+---+
                         ^                   |
                         |                   V
                  Insertion Point      Dropping Point
  ~~~

  并且每个索引对应的是一个键值对，比如：

  ~~~
  | 42 | { key: 'Content-Type', value: 'application/javascript' } |
  ~~~

- **头字段键值对**（比如：`:method: GET`）

- **头列表**（Header List），就是头字段的集合：

  ~~~yaml
  :method: GET
  :scheme: https
  :authority: www.example.com
  :path: /index.html
  user-agent: curl/8.0.1
  accept: */*
  ~~~

- **头字段表示**（Header Field Representation），是 HPACK 中用来表示一个**头字段键值对**的方法和格式，HPACK的核心，其一共有4中**索引方式**：

  | 类型名称                                              | 是否索引 | 是否修改动态表 | 特点说明                                                  |
  | ----------------------------------------------------- | -------- | -------------- | --------------------------------------------------------- |
  | 1. **Indexed Header Field**                           | ✅ 是     | ❌ 不修改       | 只用一个索引，直接引用静态/动态表中的字段（节省空间最大） |
  | 2. **Literal Header Field with Incremental Indexing** | ✅ 是     | ✅ 会加入动态表 | 新字段，将其加入动态表供下次引用                          |
  | 3. **Literal Header Field without Indexing**          | ❌ 否     | ❌ 不修改       | 不加入动态表，只发送一次，适合敏感字段                    |
  | 4. **Literal Header Field Never Indexed**             | ❌ 否     | ❌ 不修改       | 明确指示“永远不应该被索引”，防止中间节点缓存              |

- **头块**（Header Block），**头字段表示**的有序列表，和**头字段表示**的关系与**头字段键值对**和**头列表**间的关系一致。

那么现在的问题就在于如何将**头字段键值对**编码成**头字段表示**或如何将**头字段表示**解码成**头字段键值对**。首先我们需要明确，**头字段表示**可以将**头字段键值对**以两种主要形式表示：

- 整数形式（索引形式）

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | ? | ? | ? |       Value       |
  +---+---+---+-------------------+
  ~~~

  这里的value存的主要是要到静态表和动态表的联合索引空间里寻址的索引。

  我们看到0/1/2位为问号，这是**控制语义**，用于标识**索引方式**。

  编码过程如下：

  ~~~C
  if I < 2^N - 1, encode I on N bits
  else
      encode (2^N - 1) on N bits
      I = I - (2^N - 1)
      while I >= 128
           encode (I % 128 + 128) on 8 bits
           I = I / 128
      encode I on 8 bits
  // 其中N在第一个字节中为5，因为有控制语义占位，在后面的字节中为7，因为最高位用于做延续标志，1表示仍然需要计算，0表示终止
  ~~~

  假设我们有一个整数10，整数`10 < 2 ^ ( 8 - 3 ) - 1`，所以可以直接写入行内：

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | X | X | X | 0 | 1 | 0 | 1 | 0 |   10 stored on 5 bits
  +---+---+---+---+---+---+---+---+
  ~~~

  假设我们有一个整数1337，整数`1337 > 2 ^ ( 8 - 3 ) - 1`，则

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | X | X | X | 1 | 1 | 1 | 1 | 1 |  Prefix = 31, I = 1306
  | 1 | 0 | 0 | 1 | 1 | 0 | 1 | 0 |  1306>=128, encode(1306 % 128 + 128), I=1306/128
  | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 |  10<128, encode(10), done
  +---+---+---+---+---+---+---+---+
  ~~~

  解码过程如下：

  ~~~C
  if I < 2^N - 1, return I
  else
      M = 0
      repeat
          B = next octet
          I = I + (B & 127) * 2^M
          M = M + 7
      while B & 128 == 128
      return I
  ~~~

- 字符串形式（非索引形式）

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | H |    String Length (7+)     |
  +---+---------------------------+
  |  String Data (Length octets)  |
  +-------------------------------+
  ~~~

  其中H为是否使用Huffman编码的flag，H=1表示使用Huffman编码，H=0表示使用常规UTF-8编码。这里就没有什么延续位和控制位了。

下面我们引入**头字段表示**的四种**索引方式**：

- **Indexed Header Field**

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 1 |        Index (7+)         |
  +---+---------------------------+
  ~~~

-  **Literal Header Field with Incremental Indexing**

  加上索引类方式编码后，H就不会和**Indexed Header Field**中的1弄混了。

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 1 |      Index (6+)       |
  +---+---+-----------------------+
  | H |     Value Length (7+)     |
  +---+---------------------------+
  | Value String (Length octets)  |
  +-------------------------------+
  ~~~

-  **Literal Header Field without Indexing**

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 0 | 0 | 0 |  Index (4+)   |
  +---+---+-----------------------+
  | H |     Value Length (7+)     |
  +---+---------------------------+
  | Value String (Length octets)  |
  +-------------------------------+
  ~~~

-  **Literal Header Field Never Indexed**

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 0 | 0 | 1 |  Index (4+)   |
  +---+---+-----------------------+
  | H |     Value Length (7+)     |
  +---+---------------------------+
  | Value String (Length octets)  |
  +-------------------------------+
  ~~~

具体如何选择索引方式就根据发送方自己判断了，加上对应的索引方式编码即可。

到这里相信读者应该都对HPACK算法有一个基本认识了，下面是整个HPACK过程的一个工作流图：

![](.\images\Snipaste_2025-08-01_15-40-34.jpg)

#### HTTP/3

在HTTP/2中，队头阻塞貌似解决的很好，流之间不互相干扰，正常来讲上层建筑是没问题了，但是地基出了问题，TCP成为了HTTP/2队头阻塞的原因。具体来说，TCP对于**丢包**的情况是**无法容忍**的，现在有两种解决这个问题的方法：**N版本回退**、**按需重传**。N版本回退就不用说了，对性能的影响很重，一般不会使用，常规TCP处理丢包使用的就是**按需重传**，那么按需重传是如何造成队头阻塞的呢？我们都知道TCP里有一个SEC字段，用于告知对等方我数据读到哪了，假设`SEC=128`，那么前面128个数据包我肯定都读过了。这造成一个问题，假设某个包丢了，那我就需要等待其重传，也就会将SEC停留再等待这个包完成重传上，于是就造成了后续的包的阻塞。

以上就是TCP造成的**HTTP/2**的**队头阻塞**，居然从根上出了问题！那怎么办呢？换一个根啊！于是`HTTP/3`将`TCP`转为使用基于`UDP`协议的多路复用传输协议`QUIC`协议。

##### QUIC

QUIC是一个基于UDP的**可靠**传输层协议，QUIC设计的目的是为了取代TCP，所以也常被称为TCP/2，由于本篇文章主要介绍的是应用层协议，所以在这里不会对QUIC进行太详细的进行介绍，本小节主要介绍其基本工作原理。

在QUIC中有三个主要概念：**流**、**连接**、**数据包和帧**。

- **流**

  - 流在QUIC中体现为**帧**

  - 流可以是单向的也可以是双向的

  - 一个连接上的所有**流都是唯一的**，根据stream ID(62位整数)区分，一个连接不可复用stream ID

  - stream ID的最低位（0x01）标识了流的启动方，如果设为0则表示客户端建立的流，如果为1则表示服务器建立的流；倒数第二位则表示是双向还是单向，0为双向，1为单向，总结如下：

    | Bits | 流类型                                               |
    | :--- | :--------------------------------------------------- |
    | 0x00 | 客户端发起，双向（Client-Initiated, Bidirectional）  |
    | 0x01 | 服务器发起，双向（Server-Initiated, Bidirectional）  |
    | 0x02 | 客户端发起，单向（Client-Initiated, Unidirectional） |
    | 0x03 | 服务器发起，单向（Server-Initiated, Unidirectional） |

  - 流帧（stream Frames）用于封装应用程序发送的数据，收发端利用流帧中的stream ID和偏移字段来**按顺序**放置数据；同一偏移的数据可以被发送多次，但是不能被修改，已收到的数据可以被丢弃；发送的数据量需要在对等方设置的拥塞窗口限制内

  - Quic**不定义优先级标识位**，而交由应用程序指示，将优先级控制交给应用程序自己

  - 流一共有两种状态，**接收状态**和**发送状态**，单向时每个端点都只有一个状态，而双向时每个端点有两个状态

    流的发送状态状态机：

    ~~~ts
        o
        | Create Stream (Sending)
        | Peer Creates Bidirectional Stream
        v
    +-------+
    | Ready | Send RESET_STREAM
    |       |-----------------------.
    +-------+                       |
        |                           |
        | Send STREAM /             |
        |      STREAM_DATA_BLOCKED  |
        v                           |
    +-------+                       |
    | Send  | Send RESET_STREAM     |
    |       |---------------------->|
    +-------+                       |
        |                           |
        | Send STREAM + FIN         |
        v                           v
    +-------+                   +-------+
    | Data  | Send RESET_STREAM | Reset |
    | Sent  |------------------>| Sent  |
    +-------+                   +-------+
        |                           |
        | Recv All ACKs             | Recv ACK
        v                           v
    +-------+                   +-------+
    | Data  |                   | Reset |
    | Recvd |                   | Recvd |
    +-------+                   +-------+
    
    // 其中Data Recvd状态表示发送的数据已经全部被接收方确认
    // Reset Recvd表示接收方收到发送方需要重置传输的请求，此时可以重传数据
    ~~~

    流的接收状态状态机：

    ~~~ts
        o
        | Recv STREAM / STREAM_DATA_BLOCKED / RESET_STREAM
        | Create Bidirectional Stream (Sending)
        | Recv MAX_STREAM_DATA / STOP_SENDING (Bidirectional)
        | Create Higher-Numbered Stream
        v
    +-------+
    | Recv  | Recv RESET_STREAM
    |       |-----------------------.
    +-------+                       |
        |                           |
        | Recv STREAM + FIN         |
        v                           |
    +-------+                       |
    | Size  | Recv RESET_STREAM     |
    | Known |---------------------->|
    +-------+                       |
        |                           |
        | Recv All Data             |
        v                           v
    +-------+ Recv RESET_STREAM +-------+
    | Data  |--- (optional) --->| Reset |
    | Recvd |  Recv All Data    | Recvd |
    +-------+<-- (optional) ----+-------+
        |                           |
        | App Read All Data         | App Read Reset
        v                           v
    +-------+                   +-------+
    | Data  |                   | Reset |
    | Read  |                   | Read  |
    +-------+                   +-------+
    ~~~

    以上状态可以映射到HTTP/2上：

    | Sending Part             | Receiving Part           | Composite State（http/2） |
    | :----------------------- | :----------------------- | :------------------------ |
    | No Stream / Ready        | No Stream / Recv (*1)    | idle                      |
    | Ready / Send / Data Sent | Recv / Size Known        | open                      |
    | Ready / Send / Data Sent | Data Recvd / Data Read   | half-closed (remote)      |
    | Ready / Send / Data Sent | Reset Recvd / Reset Read | half-closed (remote)      |
    | Data Recvd               | Recv / Size Known        | half-closed (local)       |
    | Reset Sent / Reset Recvd | Recv / Size Known        | half-closed (local)       |
    | Reset Sent / Reset Recvd | Data Recvd / Data Read   | closed                    |
    | Reset Sent / Reset Recvd | Reset Recvd / Reset Read | closed                    |
    | Data Recvd               | Data Recvd / Data Read   | closed                    |
    | Data Recvd               | Reset Recvd / Reset Read | closed                    |

- **连接**

  - 每个连接都具有一组连接标识符或connection ID，每个connection ID都可以识别连接，对等双方的connection ID不一定保持一致，但需要能标识到同一个连接

  - 发送的数据包（UDP层）将通过connetction ID与连接绑定

  - 发送给客户端的有效数据包始终包含客户端的connection ID；发送给服务端的有效数据包同理

  - Quic的连接握手支持0-RTT和1-RTT，流程如下：

    ~~~
    Client                                               Server
    Initial (CRYPTO)
    0-RTT (*)              ---------->
                                               Initial (CRYPTO)
                                             Handshake (CRYPTO)
                           <----------                1-RTT (*)
    Handshake (CRYPTO)
    1-RTT (*)              ---------->
                           <----------   1-RTT (HANDSHAKE_DONE)
    1-RTT                  <=========>                    1-RTT
    ~~~

    其中0-RTT表示无需等待完整握手，客户端**可以立即发送数据**，1-RTT表示建立连接时需要一次完整的来回（握手）才能开始传数据。

    具体的连接示例如下（每行表示一个数据包，比如Initial[0]: CRYPTO[CH]表示一个类型为initial的数据包，包编号为0，内部包含CRYPTO帧并携带ClientHello(CH)）：
    **0-RTT**：

    其中ACK[0/1]的0/1对应包的编号，比如`xxx[x]: ..., ACK[1]`对应回复`xxx[1]: ...`

    ~~~sh
    Client                                                  Server
    Initial[0]: CRYPTO[CH]
    0-RTT[0]: STREAM[0, "..."] ->
                                     Initial[0]: CRYPTO[SH] ACK[0]
                                      Handshake[0] CRYPTO[EE, FIN]
                                      						# 此时ACK[0]回复前面的0-RTT[0]
                              <- 1-RTT[0]: STREAM[1, "..."] ACK[0]
    Initial[1]: ACK[0]
    Handshake[0]: CRYPTO[FIN], ACK[0]
    1-RTT[1]: STREAM[0, "..."] ACK[0] ->
                                              Handshake[1]: ACK[0]
                                          # 奇数原则
             <- 1-RTT[1]: HANDSHAKE_DONE, STREAM[3, "..."], ACK[1]
    ~~~

    **1-RTT**：

    ~~~sh
    Client                                                  Server
    Initial[0]: CRYPTO[CH] ->
                                     Initial[0]: CRYPTO[SH] ACK[0]
                           Handshake[0]: CRYPTO[EE, CERT, CV, FIN]
                                     <- 1-RTT[0]: STREAM[1, "..."]
    Initial[1]: ACK[0]
    Handshake[0]: CRYPTO[FIN], ACK[0]
    1-RTT[0]: STREAM[0, "..."], ACK[0] ->
                                              Handshake[1]: ACK[0]
             <- 1-RTT[1]: HANDSHAKE_DONE, STREAM[3, "..."], ACK[0]
    ~~~

    一般来说第一次连接使用的都是**1-RTT**，而重连则可以选择使用**0-RTT**。在上面两个例子中**0-RTT**究竟比**1-RTT**快在哪？我们在**0-RTT的例子中看到**客户端在还没握完手时就发送了流帧`0-RTT[0]: STREAM[0, "..."] ->`，而**1-RTT**则需要在握完手后才能发送，这样的处理快了一个RTT。但是有的读者可能会问，既然**0-RTT**开始就发送了流帧，为什么后续还要重发`1-RTT[1]: STREAM[0, "..."] ACK[0] ->`一遍呢？这不就让**0-RTT**显得有点多余了吗？实际上我们并不能确定服务器是否会处理**0-RTT**的流帧，所以才会在**1-RTT**的上重发流帧，如果处理了当然皆大欢喜，如果没处理也能正常保证可靠性，因为在QUIC的世界里流帧是可以重复传输的，多余的流帧直接丢弃即可。

- **数据包和帧**

  - 数据包和帧的关系是，数据包包含帧，数据包是UDP中的**最小传输单元**，而帧是**协议逻辑单元**，描述控制/数据等内容，其关系可视化如下：

    ~~~
    +--------------------------+
    | Packet Header            |  ← QUIC的连接ID、加密信息等
    +--------------------------+
    | Encrypted Payload        |
    |   +-------------------+  |
    |   | Frame 1           |  |  ← 比如 STREAM 帧
    |   +-------------------+  |
    |   | Frame 2           |  |  ← 比如 ACK 帧
    |   +-------------------+  |
    |   | Frame 3           |  |  ← 比如 CRYPTO 帧
    |   +-------------------+  |
    +--------------------------+
    ~~~

  - 一个UDP数据报可以包含多个数据包

可以看到QUIC和HTTP/2有点类似，他们之间似乎有相互借鉴：一个连接中分为多个**流**，以此来解决某个请求的阻塞导致的整个链路的阻塞的问题。

不过我们要区分一个问题，就是**请求**这个概念只有在应用层才有，先前在HTTP/2中说的一个**流**代表一个**请求**在QUIC就不同了，应用层的**请求**在QUIC中可能会被拆分成多次数据包的往返，而一次数据包的往返可能就新建了一个**流**，所以在QUIC中**流**是更细化的存在。但这并不是说一个**流**就只能进行一次数据往返，我们前面提到**流**内除了有stream ID进行区分外，还有偏移进行排序，多次的数据往返中，可能会存在stream ID相同，但是偏移不同的情况。

总而言之,QUIC和HTTP/2的相似之处很多，读者可以借鉴HTTP/2来理解QUIC。

##### QPACK

QPACK为HPACK的改进版本，用于解决HPACK中解码器的串行堵塞问题：

~~~
客户端流1：
HEADERS -> 引用了索引42（动态表）

→ 如果解码器还没搜到索引42，对不起，整个流必须等待。
~~~

所有的流都必须等待动态表索引完成才能进行后续操作。

**为什么HPACK不支持并行解码呢**？主要是因为解码器（动态表）是一个可变队列，如果不严格串行执行，会导致索引到不存在的值或错误的值（每个流的头帧都要修改动态表，所以动态表某种意义上算是每个流的头帧独享的）。比如：

我们知道客户端和服务端都维护了一套编码器/解码器，此时要建立A和B两个流，并且A和B有相同的头`authorization: Bearer xxx`。

- 在串行解码的条件下：

  A先发送，在客户端的编码器/解码器上给头添加索引，然后发送给服务端，服务端解码A并更新编码器/解码器；然后客户端再发送B，从客户端的编码器中找到`authorization: Bearer xxx`头字段的索引，发送给服务端，服务端的解码器也能找到该索引，完成。

- 在并行解码的条件下：

  还是A先发送，在客户端的编码器/解码器上给头添加索引，然后发送给服务端，但是此时服务端还没解码完成，B就发送了，并且携带从客户端编码器/解码器中获取的`authorization: Bearer xxx`头字段的索引到服务端，找不到索引，失败。

**QPACK是如何支持并行的？**其实主要就是解决**解码器可能会遇到一个不存在的索引**的问题。在此之前我们先看一下在QPACK中**Encoded Field Section Prefix**（类似于HPACK中的**头字段表示**）结构：

~~~
  0   1   2   3   4   5   6   7
+---+---+---+---+---+---+---+---+
|   Required Insert Count (8+)  |
+---+---------------------------+
| S |      Delta Base (7+)      |
+---+---------------------------+
|      Encoded Field Lines    ...
+-------------------------------+
~~~

下面来看一下QPACK对于并行的解决方法：

- 编码器（encoder）

  我们可以看到在**头字段表示**有`Required Insert Count`，编码器会检查动态表内的字段，如果存在符合条件的就设置`Required Insert Count`为比动态表中最大**绝对索引**还大1的值（就类似数组索引和数组长度，Required Insert Count比作数组长度，所以需要+1），如果没有符合条件的就设置为0。在QPACK中定义了`Required Insert Count`的计算方式：

  ~~~sh
  # ReqInsertCount为比动态表中最大绝对索引 + 1
  if ReqInsertCount == 0:
     EncInsertCount = 0
  else:
     EncInsertCount = (ReqInsertCount mod (2 * MaxEntries)) + 1 # MaxEntries为动态表的最大条目数
  
  # EncInsertCount为最终发出的Required Insert Count
  ~~~

- 解码器（decoder）

  ~~~sh
  # EncodedInsertCount为上面的EncInsertCount
  FullRange = 2 * MaxEntries # MaxEntries为动态表的最大条目数
  if EncodedInsertCount == 0:
     ReqInsertCount = 0
  else:
     if EncodedInsertCount > FullRange:
        Error
     MaxValue = TotalNumberOfInserts + MaxEntries # TotalNumberOfInserts是解码器动态表中的插入总数
     # MaxWrapped为ReqInsertCount的最大可能值
     MaxWrapped = floor(MaxValue / FullRange) * FullRange
     ReqInsertCount = MaxWrapped + EncodedInsertCount - 1
     if ReqInsertCount > MaxValue:
        if ReqInsertCount <= FullRange:	
           Error
        ReqInsertCount -= FullRange
     if ReqInsertCount == 0:
        Error
  ~~~

  用以上算法解码`Required Insert Count`，所得结果小于或等于解码器动态表的`Insert Count`时，就可以立即解码，否则会阻塞至`Insert Count`增加到满足条件。
  
  > **rfc9204**
  >
  > Insert Count: The total number of entries inserted in the dynamic table.

下面我们来看一下编/解码器完整的工作流：

**添加条目**

- 编码器，接收到新的头字段，生成**编码器指令**帧（插入和复制），在通过与**本端的动态表**和**解码器**建立的流上发送**编码器指令**。

- **本端的动态表**更新条目，**解码器**端更新器**解码器端的动态表**（编码器和解码器分别维持各自的动态表，但都是由编码器更新）

  > **rfc9204**
  >
  > The dynamic table consists of a list of field lines maintained in first-in, first-out order. A QPACK encoder and decoder share a dynamic table that is initially empty. The encoder adds entries to the dynamic table and sends them to the decoder via instructions on the encoder stream

- **解码器**端更新器**解码器端的动态表**后，同时更新`Insert Count`（插入和复制都会更新），并且需要通知**编码器**“我更新到哪了”，通知帧格式为：

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 0 |     Increment (6+)    |
  +---+---+-----------------------+
  ~~~

  这个帧用于增加存储在编码器上的`Known Received Count`，`Known Received Count`记录的是**解码器确认的动态表插入和重复的总数**。其作用主要是：**编码器跟踪`Known Received Count`，以确定可以在不潜在阻塞流的情况下引用哪些动态表条目**。

  >**rfc9204**
  >
  >The Known Received Count is the total number of dynamic table insertions and duplications acknowledged by the decoder. The encoder tracks the Known Received Count in order to identify which dynamic table entries can be referenced without potentially blocking a stream. The decoder tracks the Known Received Count in order to be able to send Insert Count Increment instructions.

**使用条目**

- 编码器接收到某个头时，发现其存在动态表中，计算出`Required Insert Count`的值后，生成**头字段表示**，发送给解码器

- 解码器发现接收到的**头字段表示**`Required Insert Count`不为零，处理了该头字段后会给编码器发送一个`Section Acknowledgment`帧

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 1 |      Stream ID (7+)       |
  +---+---------------------------+
  ~~~

  用于告知编码器，解码器已经处理到哪了。

> **注意**
>
> 一对编/解码器指的是**客户端的编码器和服务端的解码器**或**客户端的解码器和服务端的编码器**，两对之间并不需要对齐环境。

通过以上内容，我们可以知道QPACK如何处理**解码器可能会遇到一个不存在的索引**，它使用了两个保证，一个是在编码器比较`Known Received Count`确定是否进行编码；一个是在解码器比较`Required Insert Count`和本端动态表的`Insert Count`，以此来判断是否阻塞解码。而阻塞也只是在单个流上阻塞，并不会影响其他流的解码，以此实现并发解码。

以上是关于**编码器和解码器的条目使用工作流**，是一个概览，下面我们来看看**解码器具体是如何解码的**。

在QPACK中引入了三个索引：

- **绝对索引**（Absolute Index）

  表示动态表里某个条目的全局索引，类似 HPACK 的索引，或者也可以说是`Insert Count`。

- **相对索引**（Relative Index）

  相对索引为**基于最新某个基准向后偏移的索引**

  某个基准主要分两种情况：

  - **编码器指令**中

    在编码器指令中主要是用于复用时才会使用到相对索引，比如`Insert with Name Reference`用于更新某个head field的value或者`Duplicate`用于复制一个完整的**头字段**

    Relative Index在**编码器指令**中会一直将0指向动态表的表头（最新插入的字段）：

    ~~~
          +-----+---------------+-------+
          | n-1 |      ...      |   d   |  Absolute Index
          + - - +---------------+ - - - +
          |  0  |      ...      | n-d-1 |  Relative Index
          +-----+---------------+-------+
          ^                             |
          |                             V
    Insertion Point               Dropping Point
    ~~~

  - **头字段表示**中

    在头字段表示中使用主要就是用于编码器的索引了。

    Relative Index在**头字段表示**中是基于`Base`来确定0位的：

    ~~~
            Base
                |
                V
    +-----+-----+-----+-----+-------+
    | n-1 | n-2 | n-3 | ... |   d   |  Absolute Index
    +-----+-----+  -  +-----+   -   +
                |  0  | ... | n-d-3 |  Relative Index
                +-----+-----+-------+
    ~~~

- Post-Base Index

  其实也是相对索引的一类，只不过其与Relative Index增长方向相反。
  
  ~~~
             Base
              |
              V
  +-----+-----+-----+-----+-----+
  | n-1 | n-2 | n-3 | ... |  d  |  Absolute Index
  +-----+-----+-----+-----+-----+
  |  1  |  0  |                    Post-Base Index
  +-----+-----+
  ~~~

到这里读者会疑惑，这个`Base`是什么呢？

我们回顾前文提到的**Encoded Field Section Prefix**，他由`Delta Base`计算得出（一般`Delta Base`由程序员进行控制）。主要用于计算相对索引，以减少空间的消耗，我们知道`Absolute Index`是无限增加的，所以到后面会有严重的空间消耗问题。计算公式如下：

~~~sh
# 其中Sign为1bit的S，0表示Base大于或等于Required Insert Count的值，1表示Base小于Required Insert Count的值
if Sign == 0:
   Base = ReqInsertCount + DeltaBase
else:
   Base = ReqInsertCount - DeltaBase - 1
~~~

知道了索引怎么用了之后，下面我们看看索引是在哪用的，也是和`HPACK`一样，分为几类索引帧，接在**Encoded Field Section Prefix**之后：

- **Indexed Field Line**

  常规索引，利用Absolute Index来索引头字段

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 1 | T |      Index (6+)       |
  +---+---+-----------------------+
  ~~~

- **Indexed Field Line with Post-Base Index**

  利用Post-Base Index来索引头字段

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 0 | 0 | 1 |  Index (4+)   |
  +---+---+---+---+---------------+
  ~~~

- **Literal Field Line with Name Reference**

  表示索引空间内存在这个条目，但值是新的，老位置通过Absolute Index查找

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 1 | N | T |Name Index (4+)|
  +---+---+---+---+---------------+
  | H |     Value Length (7+)     |
  +---+---------------------------+
  |  Value String (Length bytes)  |
  +-------------------------------+
  ~~~

- **Literal Field Line with Post-Base Name Reference**

  表示索引空间内存在这个条目，但值是新的，老位置通过Post-Base Index查找

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 0 | 0 | 0 | N |NameIdx(3+)|
  +---+---+---+---+---+-----------+
  | H |     Value Length (7+)     |
  +---+---------------------------+
  |  Value String (Length bytes)  |
  +-------------------------------+
  ~~~

- **Literal Field Line with Literal Name**

  新条目，无索引

  ~~~
    0   1   2   3   4   5   6   7
  +---+---+---+---+---+---+---+---+
  | 0 | 0 | 1 | N | H |NameLen(3+)|
  +---+---+---+---+---+-----------+
  |  Name String (Length bytes)   |
  +---+---------------------------+
  | H |     Value Length (7+)     |
  +---+---------------------------+
  |  Value String (Length bytes)  |
  +-------------------------------+
  ~~~

##### 小结

HTTP/3中比较新的东西就是**QUIC**和**QPACK**，用于解决队头阻塞问题，其他核心工作流和HTTP/2类似，这里就不再赘述了。

#### HTTPS



#### SSE

SSE又被称为server-event，是2015年W3C提出的关于HTML5的一个建议性规范里的内容。

SSE基于HTTP协议，在规定中，定义了一个类用于实现服务器推送：

~~~ts
var source = new EventSource('updates.cgi');
source.onmessage = function (event) {
  alert(event.data);
};

// 实现的效果如下：
// 响应头携带Content-Type: text/event-stream，响应体内容如下：
// data: This is the first message.
// data: This is the second message, it
// data: has two lines.
// data: This is the third message.
~~~

SSE支持自定义事件类型：

~~~ts
var source = new EventSource('updates.cgi');
source.addEventListener('add', addHandler, false);
source.addEventListener('remove', removeHandler, false);

// event: add
// data: 73857293
// event: remove
// data: 2153
// event: add
// data: 113411
// 默认事件类型为message
~~~

很多读者会疑惑，HTTP/1.1并不支持服务器推送，那么为什么基于HTTP/1.1还能使用SSE？实际上SSE和HTTP协议中定义的服务器推送没有什么关系，只要客户端和服务器建立了连接，服务器按照对应的格式发送消息，满足W3C标准的浏览器自然会帮助进行解析。

还有一个问题就是基于HTTP/1.1的SSE会收到最大连接的限制，在HTTP/1.1中，由于请求是串行的，所以我们不能在某个连接中同时使用SSE和进行其他请求，因为SSE会阻塞其他请求，只能通过额外创建一个请求来实现SSE，这样不断地建立连接后就会造成服务器甚至客户端的最大连接限制，而到了HTTP/2以后有了流的概念后，才可以在连接中同时使用SSE和进行其他请求。

#### 流式传输

很多读者会将流式传输和SSE弄混，流式传输并不等于SSE！流式传输是最终的效果，而SSE只能说是实现流式传输这个效果的手段之一。

一般情况下基于HTTP我们有三种进行流式传输的方法：

- HTTP/1.1的Chunked Transfer

  假设客户端进行了请求，服务器利用Chunked Transfer返回一个动态生成的文本：

  ~~~
  HTTP/1.1 200 OK
  Content-Type: text/plain
  Transfer-Encoding: chunked
  
  7\r\n
  Mozilla\r\n
  9\r\n
  Developer\r\n
  7\r\n
  Network\r\n
  0\r\n
  \r\n
  
  ~~~

  体现在服务端代码（node.js）上就是：

  ~~~js
  res.write('Hello ');
  res.write('World');
  res.end();
  ~~~

  而客户端接收方式如下：

  ~~~ts
  fetch('/chunked-endpoint').then(res => {
    const reader = res.body.getReader();
    function read() {
      reader.read().then(({done, value}) => {
        if (done) return;
        // value 是 Uint8Array，处理显示
        console.log(new TextDecoder().decode(value));
        read(); // 递归读下一个 chunk
      });
    }
    read();
  });
  ~~~

- SSE

  SSE用于实现流式也很简单，服务器可以将动态文本作为服务器事件一次一次的推送给客户端，前面SSE小节也已经演示过了，这里就不再赘述。

- HTTP/2之后的服务器推送

### WebSocket

WebSocket是2011年rfc6455协议中定义的一个全新的应用层协议，底层协议使用的是TCP，区别于HTTP协议，WebSocket是一个**全双工协议**，TCP本身是支持全双工的，所以本文就不过多介绍WebSocket是如何实现全双工的了。

比较需要提的也就是WebSocket的连接了，WebSocket连接被设计成了HTTP协议升级的形式（也就是通过HTTP进行握手），主要升级请求包格式为：

~~~sh
GET /chat HTTP/1.1
Host: server.example.com

# 核心头字段
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==

Origin: http://example.com

Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13
~~~

服务端回应：
~~~sh
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
~~~

> `Sec-WebSocket-Key`是随机的字符串，服务器端会用这些数据来构造出一个`SHA-1`的信息摘要。把`Sec-WebSocket-Key`加上一个特殊字符串`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`，然后计算[SHA-1](https://zh.wikipedia.org/wiki/SHA-1)摘要，之后进行[Base64](https://zh.wikipedia.org/wiki/Base64)编码，将结果做为`Sec-WebSocket-Accept`头的值，返回给客户端。如此操作，**可以尽量避免普通HTTP请求被误认为Websocket协议**。

前面也提过，TCP存在队头阻塞问题，那使用TCP作为底层框架的WebSocket也会存在队头阻塞问题。虽然存在丢包情况下，不需要人为去进行重发，但是使用者能感受到卡顿，这对于某些场景（游戏、音视频）的用户来说是很难容忍的。所以在这种对低时延敏感的场景中，我们一般不使用基于TCP这种类似于串行处理包WebSocket协议，而是用`QUIC`或`WebRTC`，即使某个数据包处理卡顿了，也不会影响后续包的处理。

### 参考文献

[HTTP Semantics-rfc9110](https://www.rfc-editor.org/rfc/rfc9110#name-introduction)

[HTTP Caching-rfc9111](https://www.rfc-editor.org/rfc/rfc9111#name-expires)

[Hypertext Transfer Protocol (HTTP/1.1): Message Syntax and Routing-rfc7230](https://www.rfc-editor.org/rfc/rfc7230.html#page-50)

[HTTP/2维基百科](https://zh.wikipedia.org/wiki/HTTP/2)

[HTTP/2-rfc9113](https://www.rfc-editor.org/rfc/rfc9113.html#name-introduction)

[HPACK: Header Compression for HTTP/2-rfc7541](https://www.rfc-editor.org/rfc/rfc7541.html)

[HTTP/3维基百科](https://zh.wikipedia.org/wiki/HTTP/3)

[QUIC: A UDP-Based Multiplexed and Secure Transport-rfc9000](https://www.rfc-editor.org/rfc/rfc9000.html)

[QPACK: Field Compression for HTTP/3-rfc9204](https://www.rfc-editor.org/rfc/rfc9204.html)

[HTML5](https://whatwg-cn.github.io/html/#toc-introduction)

[WebSocket维基百科](https://zh.wikipedia.org/wiki/WebSocket)