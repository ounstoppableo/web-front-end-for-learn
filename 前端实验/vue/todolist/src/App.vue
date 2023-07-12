<template>
  <div class="todo-container">
    <div class="todo-wrap">
      <MyHeader @addItem="addItem"></MyHeader>
      <MyList :todos="todos"></MyList>
      <OwnFooter
        :listsNum="listsNum"
        :checkedNum="checkedNum"
        @menageAllCheck="menageAllCheck"
        @delCheckedItem="delCheckedItem"
      ></OwnFooter>
    </div>
  </div>
</template>

<script>
import MyHeader from "./components/MyHeader.vue";
import MyItem from "./components/MyItem.vue";
import MyList from "./components/MyList.vue";
import OwnFooter from "./components/OwnFooter.vue";
import { v4 as uuidv4 } from "uuid";

export default {
  name: "App",
  data() {
    return {
      todos: JSON.parse(window.localStorage.getItem("todoList")),
    };
  },
  computed: {
    listsNum() {
      return this.todos.length;
    },
    checkedNum() {
      return this.todos.filter((item) => item.done === true).length;
    },
  },
  methods: {
    //添加待做事项
    addItem(value) {
      if (!value.trim()) return alert("请输入内容");
      const temp = {
        id: uuidv4(),
        title: value,
        done: false,
        isEdit: false,
      };
      this.todos.unshift(temp);
    },
    //删除项目
    delItem(todoId) {
      if (confirm("确认要删除吗?")) {
        this.todos = this.todos.filter((item) => item.id !== todoId);
      }
    },
    //点击勾选绑定数据
    checkFn(todoId){
      this.todos.forEach((item) => {
        if (item.id === todoId) {
          item.done = !item.done;
        }
      });
    },
    //全选管理
    menageAllCheck(flag) {
      this.todos.forEach((item) => (item.done = flag));
    },
    //删除选中
    delCheckedItem() {
      if (confirm("确认要删除吗?")) {
        this.todos = this.todos.filter((item) => item.done !== true);
      }
    },
    //确认编辑按钮
    editComfirm(todoId){
      this.todos.forEach((item) => {
        if (item.id === todoId) {
          item.isEdit = !item.isEdit
        }
      });
    },
    //编辑完成
    editOk(todoId,text){
      if(!text.trim()) return alert('输入不能为空')
      this.todos.forEach((item) => {
        if (item.id === todoId) {
          item.title = text
        }
      });
    }
  },
  components: {
    MyHeader,
    MyItem,
    MyList,
    OwnFooter,
  },
  watch: {
    todos: {
      deep: true,
      handler(newValue) {
        window.localStorage.setItem("todoList", JSON.stringify(newValue));
      },
    },
  },
  mounted() {
    //删除项目
    this.$bus.$on("delItem",this.delItem);
    //点击勾选绑定数据
    this.$bus.$on("checkFn",this.checkFn);
    //确认编辑按钮
    this.$bus.$on('editComfirm',this.editComfirm)
    //编辑完成
    this.$bus.$on('editOk',this.editOk)
  },
};
</script>

<style>
/*base*/
body {
  background: #fff;
}

.btn {
  display: inline-block;
  padding: 4px 12px;
  margin-bottom: 0;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.btn-danger {
  color: #fff;
  background-color: #da4f49;
  border: 1px solid #bd362f;
}

.btn-danger:hover {
  color: #fff;
  background-color: #bd362f;
}
.btn-blue {
  color: #fff;
  background-color: rgb(12, 146, 255);
  border: 1px solid rgb(12, 146, 255);
}
.btn-blue:hover {
  color: #fff;
  background-color: rgb(14, 95, 161);
}

.btn:focus {
  outline: none;
}

.todo-container {
  width: 600px;
  margin: 0 auto;
}
.todo-container .todo-wrap {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}
</style>
