export default {
    namespaced: true,
    state: {
        sum: 2,
    },
    actions: {
        oddAdd1(context){
            if(context.state.sum%2){
                context.commit('oddAdd1')
            }
        },
        waitAdd(context){
            setTimeout(()=>{
                context.commit('waitAdd')
            },500)
        }
    },
    mutations: {
        add1(state,value){
            state.sum+=value
        },
        sub1(state,value){
            state.sum-=value
        },
        oddAdd1(state){
            state.sum+=1
        },
        waitAdd(state){
            state.sum+=1
        }
    },
    getters: {
        scale10(state){
            return 10*state.sum
        }
    },
}