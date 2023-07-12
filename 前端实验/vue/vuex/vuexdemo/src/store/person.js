import { nanoid } from 'nanoid'
export default {
    namespaced: true,
    state: {
        personList: [
            { id: '001', name: '张三' },
        ],
    },
    actions: {
        addPerson(context, value) {
            if (value.trim()) {
                const person = {
                    id: nanoid(),
                    name: value
                }
                context.commit('addPerson', person)
            }
        },
        addWang(context, value) {
            if (value.indexOf('王') !== 0) return alert('请输入王姓的人')
            const person = {
                id: nanoid(),
                name: value
            }
            context.commit('addPerson', person)
        }
    },
    mutations: {
        addPerson(state, value) {
            state.personList.unshift(value)
        }
    },
    getters: {},
}