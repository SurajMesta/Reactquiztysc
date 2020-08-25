const mongoose=require('mongoose')
const Schema=mongoose.Schema


const User=new Schema({
    firstname:{type:String,required:true,max:20,min:3},
    lastname:{type:String,required:true,max:20,min:5},
    email:{type:String,required:true,max:50,min:10},
    password:{type:String,required:true,max:30,min:5},
    initials:{type:String,max:5,min:2},
    userToken:{type:String},
    tokenExp:{type:Date}

},{
    "collection":"typecoll"
})


mongoose.model('User',User)