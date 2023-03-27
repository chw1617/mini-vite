
import {createApp,h} from 'vue'
const app = createApp({
    render(){
        return h('div',{attrs:{class:'box'}},'vite')
    }
})
app.mount('#app')
console.log('mian.js')