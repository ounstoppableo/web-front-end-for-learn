### nginx安装

~~~sh
# 安装前置依赖
yum -y install gcc zlib zlib-devel pcre-devel openssl openssl-devel
cd /tmp/
# https://nginx.org/en/download.html nginx下载地址
wget http://nginx.org/download/nginx-1.13.7.tar.gz
tar -xvf nginx-1.13.7.tar.gz
# 进入目录
cd nginx-1.13.7
# 执行命令
./configure
# 执行make命令
make
# 执行make install命令
make install
# 到这就安装完成了
# 安装目录一般在/usr/local/nginx
~~~

### 开始部署

- 配置nginx.conf

  ~~~sh
  #user  nobody;
  #工作线程数，一般调成与cpu数相同
  worker_processes  2;
  #设置工作cpu，不设的话一般会分配不均
  worker_cpu_affinity 01 10;
  
  #error_log  logs/error.log;
  #error_log  logs/error.log  notice;
  #error_log  logs/error.log  info;
  
  #pid        logs/nginx.pid;
  
  #events模块主要是nginx 和用户交互网络连接优化的配置内容
  events {
  	#单个进程最大连接数（最大连接数=连接数*进程数）
  	#根据硬件调整，和前面工作进程配合起来用，尽量大，但是别把cpu跑到100%就行。每个进程允许的最多连接数，理论上每台nginx服务      器的最大连接数为。
      worker_connections  1024;
      #参考事件模型，use [ kqueue | rtsig | epoll | /dev/poll | select | poll ]; epoll模型是Linux 2.6以上版本内      核中的高性能网络I/O模型，linux建议epoll，如果跑在FreeBSD上面，就用kqueue模型。
      #补充说明：
      #与apache相类，nginx针对不同的操作系统，有不同的事件模型
      #A）标准事件模型
      #Select、poll属于标准事件模型，如果当前系统不存在更有效的方法，nginx会选择select或poll
      #B）高效事件模型
      #Kqueue：使用于FreeBSD 4.1+, OpenBSD 2.9+, NetBSD 2.0 和 MacOS X.使用双处理器的MacOS X系统使用kqueue可能会      造成内核崩溃。
      #Epoll：使用于Linux内核2.6版本及以后的系统。
      #/dev/poll：使用于Solaris 7 11/99+，HP/UX 11.22+ (eventport)，IRIX 6.5.15+ 和 Tru64 UNIX 5.1A+。
      #Eventport：使用于Solaris 10。 为了防止出现内核崩溃的问题， 有必要安装安全补丁。
      #use epoll;
      #keepalive超时时间。
      #keepalive_timeout 60;
      #客户端请求头部的缓冲区大小。这个可以根据你的系统分页大小来设置，一般一个请求头的大小不会超过1k，不过由于一般系统分页都要      大于1k，所以这里设置为分页大小。
      #分页大小可以用命令getconf PAGESIZE 取得。
      #[root@web001 ~]# getconf PAGESIZE
      #4096
      #但也有client_header_buffer_size超过4k的情况，但是client_header_buffer_size该值必须设置为“系统分页大小”的整倍      数。
      #client_header_buffer_size 4k;
      #这个将为打开文件指定缓存，默认是没有启用的，max指定缓存数量，建议和打开文件数一致，inactive是指经过多长时间文件没被请      求后删除缓存。
      #open_file_cache max=65535 inactive=60s;
      #这个是指多长时间检查一次缓存的有效信息。
      #语法:open_file_cache_valid time 默认值:open_file_cache_valid 60 使用字段:http, server, location 这个指令      指定了何时需要检查open_file_cache中缓存项目的有效信息.
      #open_file_cache_valid 80s;
      #open_file_cache指令中的inactive参数时间内文件的最少使用次数，如果超过这个数字，文件描述符一直是在缓存中打开的，如上      例，如果有一个文件在inactive时间内一次没被使用，它将被移除。
      #语法:open_file_cache_min_uses number 默认值:open_file_cache_min_uses 1 使用字段:http, server, location      这个指令指定了在open_file_cache指令无效的参数中一定的时间范围内可以使用的最小
      #文件数,如果使用更大的值,文件描述符在cache中总是打开状态.
      #open_file_cache_min_uses 1;
  
      #语法:open_file_cache_errors on | off 默认值:open_file_cache_errors off 使用字段:http, server, location      这个指令指定是否在搜索一个文件是记录cache错误.
      #open_file_cache_errors on;
  }
  
  #http模块主要配置服务器信息
  http {
      #文件扩展名与文件类型映射表
      include mime.types;
      #默认文件类型
      default_type  application/octet-stream;
      #默认编码
      charset utf-8;
      #服务器名字的hash表大小
      #保存服务器名字的hash表是由指令server_names_hash_max_size 和server_names_hash_bucket_size所控制的。参数hash      bucket size总是等于hash表的大小，并且是一路处理器缓存大小的倍数。在减少了>在内存中的存取次数后，使在处理器中加速查找      hash表键值成为可能。如果hash bucket size等于一路处理器缓存的大小，那么在查找键的时候，最坏的情况下在内存中查找的次数      为2。第一次是确定存储单元的>地址，第二次是在存储单元中查找键 值。因此，如果Nginx给出需要增大hash max size 或 hash      bucket size的提示，那么首要的是增大前一个参数的大小.
      #server_names_hash_bucket_size 128;
      #客户端请求头部的缓冲区大小。这个可以根据你的系统分页大小来设置，一般一个请求的头部大小不会超过1k，不过由于一般系统分页都      要大于1k，所以这里设置为分页大小。分页大小可以用命令getconf PAGESIZE取得。
      #client_header_buffer_size 32k;
      #客户请求头缓冲大小。nginx默认会用client_header_buffer_size这个buffer来读取header值，如果header过大，它会使用        large_client_header_buffers来读取。
      #large_client_header_buffers 4 64k;
      #设定通过nginx上传文件的大小
      #client_max_body_size 8m;
  
      #开启高效文件传输模式，sendfile指令指定nginx是否调用sendfile函数来输出文件，对于普通应用设为 on，如果用来进行下载等      应用磁盘IO重负载应用，可设置为off，以平衡磁盘与网络I/O处理速度，降>低系统的负载。注意：如果图片显示不正常把这个改成        off。
      #sendfile指令指定 nginx 是否调用sendfile 函数（zero copy 方式）来输出文件，对于普通应用，必须设为on。如果用来进行      下载等应用磁盘IO重负载应用，可设置为off，以平衡磁盘与网络IO处理速度，降低系统uptime。
      sendfile on;
      
      #开启目录列表访问，合适下载服务器，默认关闭。
      #autoindex on;
      #此选项允许或禁止使用socke的TCP_CORK的选项，此选项仅在使用sendfile的时候使用
      #tcp_nopush on;
      
      #tcp_nodelay on;
      
      
      #FastCGI相关参数是为了改善网站的性能：减少资源占用，提高访问速度。下面参数看字面意思都能理解。
      #fastcgi_connect_timeout 300;
      #fastcgi_send_timeout 300;
      #fastcgi_read_timeout 300;
      #fastcgi_buffer_size 64k;
      #fastcgi_buffers 4 64k;
      #fastcgi_busy_buffers_size 128k;
      #fastcgi_temp_file_write_size 128k;
      
      #gzip模块设置
      #gzip on; #开启gzip压缩输出
      #gzip_min_length 1k;    #最小压缩文件大小
      #gzip_buffers 4 16k;    #压缩缓冲区
      #gzip_http_version 1.0;    #压缩版本（默认1.1，前端如果是squid2.5请使用1.0）
      #gzip_comp_level 2;    #压缩等级
      #gzip_types text/plain application/x-javascript text/css application/xml;    #压缩类型，默认就已经包含        textml，所以下面就不用再写了，写上去也不会有问题，但是会有一个warn。
      #gzip_vary on;
      
      #开启限制IP连接数的时候需要使用
      #limit_zone crawler $binary_remote_addr 10m;
      #another virtual host using mix of IP-, name-, and port-based configuration
      
      #长连接超时时间，单位是秒
      keepalive_timeout  65;
  
  	#配置负载均衡，主要是用于反向代理的重定向，可以填写多个server，每个server后都可以添加权值
  	#与proxy_pass（反向代理）搭配使用
      upstream blog_nodejs_3000{
          server localhost:3000 weight=10;
      }
      #nginx服务器配置
      server {
          listen       80;
          server_name  localhost;
  
          #access_log  logs/host.access.log  main;
  		#location用于配置域名后面的url匹配
          location / {
              root   /var/my-blog/blog-system/dist;
              index  index.html index.htm;
              try_files $uri $uri/ /index.html;
          }
          #error_page  404              /404.html;
  
          # redirect server error pages to the static page /50x.html
          #
          error_page   500 502 503 504  /50x.html;
          location = /50x.html {
              root   html;
          }
          #走反向代理，^~/api/表示匹配localhost/api/*的url
          #proxy_pass最后加‘/‘表示替换掉/api/
          #例如如下配置表示：localhost/api/* 将会换成 localhost:3000/*
          location ^~/api/ {
                  proxy_pass http://blog_nodejs_3000/;
                  proxy_redirect     off;
                  proxy_set_header   Host $host;
                  proxy_set_header   X-Real-IP $remote_addr;
                  proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
                  proxy_set_header   X-Forwarded-Host $server_name;
          }
          #而这是另一种反向代理写法，proxy_pass最后不添加’/‘
          #表示拼接
          #如下配置表示：localhost/images/* 将会换成localhost:3000/images/*
          location ^~/images/ {
          proxy_pass http://blog_nodejs_3000;
                  proxy_redirect     off;
                  proxy_set_header   Host $host;
                  proxy_set_header   X-Real-IP $remote_addr;
                  proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
                  proxy_set_header   X-Forwarded-Host $server_name;
          }
      }
  }
  ~~~
  
- 开启nginx

  ~~~sh
  cd /usr/local/sbin
  #停止
  ./nginx -s stop
  #开启
  ./nginx
  ~~~

  