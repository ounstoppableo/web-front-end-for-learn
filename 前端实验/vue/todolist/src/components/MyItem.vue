<template>
  <li>
    <label>
      <input type="checkbox" :checked="todo.done" @change="checkFn(todo.id)" />
      <input
        type="text"
        v-show="todo.isEdit"
        @keyup.enter="editOk(todo.id, text)"
        ref="inputBlur"
        v-model="text"
        @blur="editItem(todo.id) & editOk(todo.id, text)"
      />
      <span v-show="!todo.isEdit">{{ todo.title }}</span>
    </label>
    <button class="btn btn-danger" @click="delItem(todo.id)">删除</button>
    <button
      class="btn btn-blue"
      v-show="!todo.isEdit"
      @click="editItem(todo.id)"
    >
      编辑
    </button>
  </li>
</template>
<script>
export default {
  name: "MyItem",
  data() {
    return {
      text: this.todo.title,
    };
  },
  props: ["todo"],
  methods: {
    delItem(id) {
      this.$bus.$emit("delItem", id);
    },
    checkFn(id) {
      this.$bus.$emit("checkFn", id);
    },
    editItem(id) {
      this.$bus.$emit("editComfirm", id);
      this.$nextTick(() => {
        this.$refs.inputBlur.focus();
      });
    },
    editOk(id, text) {
      this.$bus.$emit("editOk", id, text);
    },
  },
};
</script>
<style scoped>
/*item*/
li {
  list-style: none;
  height: 36px;
  line-height: 36px;
  padding: 0 5px;
  border-bottom: 1px solid #ddd;
}

li label {
  float: left;
  cursor: pointer;
}

li label li input {
  vertical-align: middle;
  margin-right: 6px;
  position: relative;
  top: -1px;
}

li button {
  float: right;
  display: none;
  margin-top: 3px;
  margin-left: 3px;
}

li:before {
  content: initial;
}

li:last-child {
  border-bottom: none;
}
li:hover button {
  display: block;
}
</style>