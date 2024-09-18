const OSS = require('ali-oss')
const path = require('path')
const dotenv = require('dotenv')
const fs = require('fs')

dotenv.config({path: path.resolve(__dirname, '../.env')})
const publicPath = path.resolve(__dirname, '../app/public')

//新建一个实例
const client = new OSS({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || "",
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || "",
    endpoint: `oss-cn-beijing.aliyuncs.com`,
    bucket: "p-test-ui",
})

async function run(){
    //从文件夹来获取对应的文件列表
    const publicFiles = fs.readdirSync(publicPath)
    const files = publicFiles.filter(f=>f!== 'page.nj')

    const res = await Promise.all(
        files.map(async fileName=>{
            const savedOSSPath = path.join('h5-assets', fileName).split(path.sep).join("/");
            const filePath = path.join(publicPath, fileName)
            const result = await client.put(savedOSSPath, filePath)
            const {url} = result
            return url
        })
    )
    console.log('上传成功', res)
}

run()


