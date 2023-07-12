<template>
  <section class="jumbotron">
    <h3 class="jumbotron-heading">Search Github Users</h3>
    <div>
      <input
        type="text"
        placeholder="enter the name you search"
        v-model="val"
      />&nbsp;<button @click="search(val)">Search</button>
    </div>
  </section>
</template>
<script>
import axios from "axios";
export default {
  name: "search",
  data() {
    return {
        val: '',
    }
  },
  methods: {
    search(val){
        this.$bus.$emit('getData',{isSearch: false,isLoading: true,err:'',userData:{}})
        axios.get(`https://api.github.com/search/users?q=${val}`).then(res=>{
            this.$bus.$emit('getData',{isLoading: false,err:'',userData:res.data.items})
            this.val = ''
        }).catch(err => {
            this.$bus.$emit('getData',{isLoading: false,err:err.message,userData:{}})
        })
    },
  },
};
</script>
<style>
</style>