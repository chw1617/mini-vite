// vite 开发环境
const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const app = new Koa()
const compilersfc = require('@vue/compiler-sfc')
const compilerdom = require('@vue/compiler-dom')
app.use(ctx=>{
    const {url,query} = ctx.request
   
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
        // ctx.set('cache-control',"max-age=31536000,immuatable") todo
        const moduleName = url.replace('/@modules/', '')
        const prefix = path.join(__dirname, './node_modules', moduleName)
        // 要加载文件的地址
        const module = require(prefix + '/package.json').module
        const filePath = path.join(prefix, module)
        const res = fs.readFileSync(filePath, 'utf8')
        ctx.type = "text/javascript" 
        ctx.body = replaceImport(res) // 在其内部可能还存在import代码，所以也需要重写一下
    }else if(url.indexOf('vue')>-1){
        // 处理vue 文件,多写写
        const paths = path.join(__dirname,'/example/',url.split('?')[0])
        console.log('vue',paths)
        const content = fs.readFileSync(paths,'utf-8')
        const {descriptor} = compilersfc.parse(content)
        // 处理script --- > repalceimport
        // console.log('sfc---',descriptor)
        //template.content -- >render
        console.log('url---',url,query)
        if(!query.type){
            let contents = descriptor.script.content
            contents = contents.replace('export default','const __script=')
            ctx.type = 'application/javascript'
            ctx.body = `
                ${replaceImport(contents)}
                // style 也是处理成请求
                import '${url}?type=style';
                // template 解析成单独请求
                import {render as __render} from '${url}?type=template'
                console.log('__render',__render)
                __script.render = __render
                export default __script
            `
        }else if(query.type == 'template'){
            // template
            const template = descriptor.template.content
            const render  = compilerdom.compile(template,{ mode: 'module' }).code
            ctx.type = 'application/javascript'
            ctx.body  = replaceImport(render)
        }else if(query.type == 'style'){
             // style
            const content = descriptor.styles[0].content.replace(/[\r\n]/g,'')
            const css = `
                const css = ${ JSON.stringify(content)};
                const dom = document.createElement('style')
                dom.setAttribute('type', 'text/css')
                dom.innerHTML = css
                document.head.appendChild(dom)
                // export default css
            `
            ctx.type = 'application/javascript'
            ctx.body = css
        }
       
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