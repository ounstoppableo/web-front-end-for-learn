### 背景

我们在git时常常会有不小心将隐私信息提交到远程仓库，这种情况会有很大的安全风险

### 解决方法

利用git的回滚机制进行commit撤回

1、git clone远程仓库

2、利用git log查看以前的提交记录，找到需要回滚的hash

3、执行git reset（**记住提前备份不需要被删除的文件**）

~~~sh
#软回滚，会保留记录
git reset --soft @hash
#硬回滚，会删除该记录点之后的记录
git reset --hard @hash
~~~

4、修改.gitignone，把隐私文件写入，这里**需要注意**：track过或commit过的文件.gitignore是无法生效的

5、远程同步

~~~sh
git push origin HEAD --force
~~~



