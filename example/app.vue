<template>
    <div class="color">{{msg}}</div>
</template>

<script>
 import {ref} from 'vue'
 export default {
    setup(){
        const msg = ref('vite vue hhhhhhhhhh')
        return {msg}
    }
 }
</script>

<style>
.color{
    color: pink;
}
</style>