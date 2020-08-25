const express= require('express')
const app=express()
const PORT=process.env.PORT || 5000
const mongoose=require('mongoose')
const config=require('./config/keys')
const bodyParser=require('body-parser')

bodyParser.urlencoded({extended:true})
app.use(bodyParser.json())
require('./model/model')
app.use(require('./routes/routes'))



mongoose.connect(config.DB,{useNewUrlParser:true,useUnifiedTopology:true}).then(data=> {
    console.log('Mongoose Connection Success')
},(err)=>{
    console.log('Mongoose Connection Failed')
})

if(process.env.NODE_ENV==="production"){

    app.use(express.static('frontend/build'))

    app.get('*',(req,res)=>{
        const path=require('path')
        res.sendFile(path.resolve(__dirname,'frontend','build','index.html'))
    })

}



app.listen(PORT,()=>{
    console.log(`Server is Up and Running at PORT ${PORT}`)
})