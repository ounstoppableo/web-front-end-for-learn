<template>
  <div>
    <h1>Count组件</h1>
    <h3>{{ sum }}</h3>
    <h3>放大10倍后的结果：{{scale10}}</h3>
    <select v-model.number="n">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
    </select>
    <button @click="add1(n)">+</button>
    <button @click="sub1(n)">-</button>
    <button @click="oddAdd1">奇数时+1</button>
    <button @click="waitAdd">等一会+1</button>
    <h3 style="color: red">Person组件的人数:{{personList.length}}</h3>
  </div>
</template>
<script>
import Vuex, { mapActions, mapGetters, mapMutations, mapState } from "vuex";
export default {
  name: "Count",
  data() {
    return {
      n: 1,
    };
  },
  computed: {
    ...mapState('countOptions',['sum']),
    ...mapState('personOptions',['personList']),
    ...mapGetters('countOptions',['scale10'])
  },
  methods: {
    ...mapMutations('countOptions',["add1", "sub1"]),
    ...mapActions('countOptions',['oddAdd1','waitAdd'])
  },
  mounted(){
  }
};
</script>