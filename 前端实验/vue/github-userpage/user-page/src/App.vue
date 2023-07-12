<template>
  <div class="container">
    <search></search>
    <list></list>
  </div>
</template>

<script>
import search from "./components/search.vue";
import list from "./components/list.vue";

export default {
  name: "App",
  components: {
    search,
    list,
  },
};
</script>

<style>
</style>
