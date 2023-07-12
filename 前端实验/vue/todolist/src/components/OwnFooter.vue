<template>
  <div class="todo-footer" v-show="listsNum">
    <label>
      <input type="checkbox" v-model="isAll" />
    </label>
    <span>
      <span>已完成{{ checkedNum }}</span> / 全部{{ listsNum }}
    </span>
    <button class="btn btn-danger" @click="delChecked">清除已完成任务</button>
  </div>
</template>
<script>
export default {
  name: "OwnFooter",
  props: ["checkedNum", "listsNum"],
  computed: {
    isAll: {
      get() {
        return this.checkedNum === this.listsNum && this.listsNum > 0;
      },
      set(value) {
        this.$emit('menageAllCheck',value)
      },
    },
  },
  methods: {
    delChecked(){
      this.$emit('delCheckedItem')
    }
  }
};
</script>
<style scoped>
/*footer*/
.todo-footer {
  height: 40px;
  line-height: 40px;
  padding-left: 6px;
  margin-top: 5px;
}

.todo-footer label {
  display: inline-block;
  margin-right: 20px;
  cursor: pointer;
}

.todo-footer label input {
  position: relative;
  top: -1px;
  vertical-align: middle;
  margin-right: 5px;
}

.todo-footer button {
  float: right;
  margin-top: 5px;
}
</style>