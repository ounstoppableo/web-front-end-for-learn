<template>
  <div id="app">
    <Count></Count>
    <hr>
    <Person></Person>
  </div>
</template>

<script>
import Count from './components/Count.vue'
import Person from './components/Person.vue'

export default {
  name: 'App',
  components: {
    Count,
    Person
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
