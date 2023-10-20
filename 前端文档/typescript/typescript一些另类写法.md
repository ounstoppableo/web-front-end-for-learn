### 关于this的形参问题

> 我们都知道，this是一个标识符，在js里它是不能被用作形参或变量名的，但是在ts中，它有了不一样的写法

~~~ts
function Aaa(this:unknown,...args){
   console.log('33333')
 if(this instanceof Aaa){
    return console.log('进入new')
 }
 const a = new Aaa(1,2,3,4,5)
 return console.log('222222')
}
Aaa(1,2,3,4,5,6)
//输出
//33333
//33333
//进入new
//222222
~~~

> 从以上例子我们可以看出，this被给了类型之后就能用作形参，并且可以截断函数的运行



