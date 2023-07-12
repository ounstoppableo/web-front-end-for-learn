<template>
  <div class="row">
    <h2 v-show="info.isSearch">Welcome user search page!</h2>
    <h2 v-show="info.isLoading">Loding......</h2>
    <h2 v-show="info.err">{{info.err}}</h2>
    <div class="card" v-for="user in info.userData" :key="user.node_id">
      <a :href="user.html_url" target="_blank">
        <img :src="user.fin_avatar_url" :autoExec="imgLazyload(user)" style="width: 100px" />
      </a>
      <p class="card-text">{{ user.login }}</p>
    </div>
  </div>
</template>
<script>
export default {
  name: "list",
  data() {
    return {
      info: {
        userData: {},
        isSearch: true,
        isLoading: false,
        err: '',
      },
    };
  },
  methods: {
    imgLazyload(user){
        //如果没有用户数据就往下执行了
        if(!user) return
        //如果路径设置的不是加载路径就不再设置了
        if(user.fin_avatar_url === user.avatar_url || user.fin_avatar_url==='//127.0.0.1:8080/imgLoadErr.jpg') return
        this.$set(user,'fin_avatar_url','//127.0.0.1:8080/imgLoad.jpg')
        const img = new Image()
        img.onload = function(){
          user.fin_avatar_url = user.avatar_url
        }
        img.onerror = function(){
          user.fin_avatar_url = '//127.0.0.1:8080/imgLoadErr.jpg'
        }
        img.src = user.avatar_url
    }
  },
  mounted() {
    this.$bus.$on("getData", (userObj) => {
      this.info = {...this.info,...userObj};
    });
  },
  beforeDestroy() {
    this.$bus.$off("getData");
  },
};
</script>
<style scoped>
.album {
  min-height: 50rem; /* Can be removed; just added for demo purposes */
  padding-top: 3rem;
  padding-bottom: 3rem;
  background-color: #f7f7f7;
}
.card {
  float: left;
  width: 33.333%;
  padding: 0.75rem;
  margin-bottom: 2rem;
  border: 1px solid #efefef;
  text-align: center;
}

.card > img {
  margin-bottom: 0.75rem;
  border-radius: 100px;
}

.card-text {
  font-size: 85%;
}
</style>