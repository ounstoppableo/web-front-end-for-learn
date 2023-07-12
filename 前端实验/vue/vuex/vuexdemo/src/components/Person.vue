<template>
  <div>
    <h3>Person组件</h3>
    <input type="text" v-model="personName"/>
    <button @click="addPerson(personName)">点击添加</button>
    <button @click="addWang(personName)">添加王姓的人</button>
    <ul>
      <li v-for="person in personList" :key="person.id">姓名:{{person.name}}</li>
    </ul>
    <h3 style="color:red">count组件的sum:{{countNum}}</h3>
  </div>
</template>
<script>
import { computed } from "vue";
export default {
  name: "Person",
  data() {
    return {
        personName: '',
    };
  },
  computed: {
    personList() {
      return this.$store.state.personOptions.personList;
    },
    countNum(){
        return this.$store.state.countOptions.sum
    }
  },
  methods: {
    addPerson(personName){
        this.$store.dispatch('personOptions/addPerson',personName)
        this.personName = ''
    },
    addWang(personName){
        this.$store.dispatch('personOptions/addWang',personName)
        this.personName = ''
    }
  }
};
</script>
<style>
    li {
        list-style: none;
    }
</style>