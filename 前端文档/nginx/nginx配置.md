### location匹配规则

> 首先我们要明确，location只匹配路径，和参数、域名无关
>
> 并且匹配是从域名端口后开始逐字匹配

#### location匹配的种类

~~~sh
location [ \s | = | ~ | ~* | ^~ | @ ] /path/ {

}
~~~

> - 中括号表示可选字段(location modifier)，每个可选值下面会做解释
> - /path/表示路径的匹配规则
> - 括号内填写响应规则：包括资源在服务器的位置、是否需要重定向

#### location modifier

| 字符 | 解释                                                         |
| ---- | ------------------------------------------------------------ |
| \s   | 空格，表示不写location modifier，路径字符串匹配，非pattern匹配 |
| =    | 表示精确匹配，路径完全一致才使用                             |
| ~    | 表示执行正则匹配，区分大小写匹配                             |
| ~*   | 表示执行一个正则匹配，不区分大小写匹配， 注意，如果是运行 Nginx server 的系统本身对大小写不敏感，比如 Windows ，那么 ~* 和 ~ 这两个表现是一样的 |
| ^~   | 即表示只匹配普通字符（跟空格类似，但是它优先级比空格高）。使用前缀匹配，^表示“非”，即不查询正则表达式。如果匹配成功，并且所匹配的字符串是最长的， 则不再匹配其他location |
| @    | 用于定义一个 Location块，且该块不能被外部Client 所访问，只能被Nginx内部配置指令所访问，比如try_files 或 error_page，@后不能空格，需要和/path/连接 |

#### 匹配优先级

> [=] > \[^~] > [~/~*] > [\s]

> 详细步骤：
>
> - 精确匹配，有就使用
> - 字符串匹配，找出匹配最长串，如果是^~开头则使用，如果是\s则走正则
> - 正则按书写顺序自上而下匹配，没匹配到往下
> - \s匹配

#### @ 前缀的命名匹配

~~~sh
 location / {
   error_page 418 = @queryone;
   error_page 419 = @querytwo;
   error_page 420 = @querythree;
   # 我们可以通过$args获取参数，详情情看内置常用变量列表
   if ( $args ~ "service=one" ) { return 418; }
   if ( $args ~ "service=two" ) { return 419; }
   if ( $args ~ "service=three" ) { return 420; }

   # do the remaining stuff
   # ex: try_files $uri =404;

 }

 location @queryone {
   return 200 'do stuff for one';
 }

 location @querytwo {
   return 200 'do stuff for two';
 }

 location @querythree {
   return 200 'do stuff for three';
 }
~~~

测试结果：

~~~sh
[root]#  curl http://127.0.0.1/?service=one
do stuff for one

[root]#  curl http://127.0.0.1/?service=two
do stuff for two

[root]#  curl http://127.0.0.1/?service=three
do stuff for three
~~~

#### 内置常用变量列表

| 变量名                | 定义                                                         |
| --------------------- | :----------------------------------------------------------- |
| $arg_PARAMETER        | GET请求中变量名PARAMETER参数的值                             |
| $args                 | 这个变量等于GET请求中的参数。例如，foo=123&bar=blahblah;这个变量可以被修改 |
| $content_length       | 请求头中的Content-length字段。                               |
| $content_type         | 请求头中的Content-Type字段。                                 |
| $cookie_COOKIE cookie | COOKIE的值。                                                 |
| $host                 | 请求中的主机头(Host)字段，如果请求中的主机头不可用或者空，则为处理请求的server名称(处理请求的server的server_name指令的值)。值为小写，不包含端口。 |
| $hostname             | 机器名使用 gethostname系统调用的值                           |
| $http_HEADER          | HTTP请求头中的内容，HEADER为HTTP请求中的内容转为小写，-变为_(破折号变为下划线)，例如：$http_user_agent ( User-Agent的值 ) |
| $sent_http_HEADER     | HTTP响应头中的内容，HEADER为HTTP响应中的内容转为小写，-变为_(破折号变为下划线)，例如: $sent_http_cache_control( Cache-Control的值 ) |
| $is_args              | 如果$args设置，值为"?"，否则为""。                           |
| $limit_rate           | 这个变量可以限制连接速率。                                   |
| $query_string         | 与$args相同。                                                |
| $remote_addr          | 客户端的IP地址                                               |
| $remote_port          | 客户端的端口                                                 |
| $remote_user          | 已经经过Auth Basic Module验证的用户名                        |
| $request_filename     | 当前连接请求的文件路径，由root或alias指令与URI请求生成       |
| $request_uri          | 这个变量等于包含一些客户端请求参数的原始URI，它无法修改，请查看$uri更改或重写URI。 |
| $scheme               | 所用的协议，比如http或者是https，比如rewrite ^(.+)![img](https://juejin.cn/equation?tex=)scheme://example.com$1 redirect; |
| $server_addr          | 服务器地址，在完成一次系统调用后可以确定这个值，如果要绕开系统调用，则必须在listen中指定地址并且使用bind参数。 |
| $server_name          | 服务器名称                                                   |
| $server_port          | 请求到达服务器的端口号。                                     |
| $server_protocol      | 请求使用的协议，通常是HTTP/1.0或HTTP/1.1。                   |
| $uri                  | 请求中的当前URI(不带请求参数，参数位于args)，不同于浏览器传递的args，不同于浏览器传递的request_uri的值，它可以通过内部重定向，或者使用index指令进行修改。不包括协议和主机名，例如/foo/bar.html |

