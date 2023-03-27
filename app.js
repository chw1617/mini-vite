// vite 开发环境
const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const app = new Koa()

app.use(ctx=>{
    const {url} = ctx.request
    console.log('url---',url)
    if(url === '/'){
        // 访问跟目录，直接返回html
        const html = fs.readFileSync('./example/index.html','utf-8')
        ctx.type = 'text/html' //文件类型
        ctx.body = html
    }else if(url.endsWith('js')){
        // 处理js文件
        const filePath = path.join(__dirname,'/example/',url)
        console.log(filePath)
        const jsContent = fs.readFileSync(filePath,'utf-8')
        ctx.type = 'application/javascript'
        ctx.body = replaceImport(jsContent)
    }else if(url.startsWith('/@modules/')){
        // 获取@modules后面的部分，模块名称
        const moduleName = url.replace('/@modules/', '')
        const prefix = path.join(__dirname, './node_modules', moduleName)
        // 要加载文件的地址
        const module = require(prefix + '/package.json').module
        const filePath = path.join(prefix, module)
        const res = fs.readFileSync(filePath, 'utf8')
        ctx.type = "text/javascript" 
        ctx.body = replaceImport(res) // 在其内部可能还存在import代码，所以也需要重写一下
    }
    
})

function replaceImport(content){
    // 替换import 方式
    // console.log(content)
    return content.replace(/from ['"](.*)['"]/g,(s1,s2)=>{
        // s1 匹配的，s2 分组
        if(s2.startsWith('/') || s2.startsWith('./') || s2.startsWith('../')){
            return s1
        }else{
            return ` from "/@modules/${s2}"`
        }
    })
}
app.listen(5000,()=>{
    console.log('server start')
})