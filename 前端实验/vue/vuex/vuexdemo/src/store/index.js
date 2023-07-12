import Vue from 'vue'
import Vuex from 'vuex'
import countOptions from './count'
import personOptions from './person'
Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        countOptions,
        personOptions
    }
})