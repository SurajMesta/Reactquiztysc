const {TOKEN_SECRET}=require('../config/keys')
const jwt=require('jsonwebtoken')
const mongoose=require('mongoose')
const User=mongoose.model('User')


module.exports= (req,res,next)=>{
    const {authorization}=req.headers
    if(!authorization){
        res.json({message:"Please Login"})
    }
    else{
        const token= authorization.replace("Bearer ","")
        const data=jwt.verify(token,TOKEN_SECRET)
      User.findById({_id:data._id}).then((data)=>{
          req.user=data
          next()
      }).catch(err=>{
          res.json({message:"Something went wrong"})

      })
    }


}