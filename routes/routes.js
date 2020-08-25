const express=require('express')
const appRouter=express.Router()
const mongoose=require('mongoose')
const User=mongoose.model('User')
const joi=require('@hapi/joi')
const bcrypt= require('bcryptjs')
const assert=require('assert')
const jwt=require('jsonwebtoken')
const {TOKEN_SECRET}=require('../config/keys')
const verifyToken=require('./verifyToken')
const nodemailer=require('nodemailer')
const sendGrid=require('nodemailer-sendgrid-transport')

const crypto=require('crypto')



const Schema={
    signUpValid:joi.object({
        firstname:joi.string().required().max(20).min(3),
        lastname:joi.string().required().max(20).min(5),
        email:joi.string().email().required().max(50).min(10),
        password:joi.string().max(30).min(5)
    })
}

// const transport=nodemailer.createTransport({
//     host:'smtp.mailtrap.io',
//     port:"2525",
//     auth:{
//         user:'2e3b3bc0ba1557',
//         pass:'5d2fba8933c823'
//     }
// })

// const transport=nodemailer.createTransport(sendGrid({
//     auth:{
//         api_key:API_KEY
//     }
// }))

const transport=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'d8861772715@gmail.com',
        pass:'DarshanKA47'
    }
})


appRouter.get('/home',verifyToken,(req,res)=>{
   
    res.json(req.user)
    
})

appRouter.post('/signup',(req,res)=>{
   const{firstname,lastname,email,password}=req.body

   if(!firstname || !lastname || !email || !password){
       res.status(401).json({message:"Please Enter All the Fields (firstname,lastname,email,password)"})
   }

   else{
    User.findOne({email:email}).then((data)=>{
        if(data){
            res.json({message:"User Email already exists please use a different one"})
        }
        else{
         const validated=Schema.signUpValid.validate(req.body)
         if(validated.error){
             res.json({message: validated.error.details[0].message})
         }

         else{
            bcrypt.genSalt(10,(err,salt)=>{
                if(err){
                   res.json({message:"Something went wrong"})
                }
                else{
                 console.log(salt)
                 bcrypt.hash(password,salt,(err,hash)=>{
                     if(err){
                         res.json({message:"Something Went wrong"})
                     }
                     else{
                        const user= new User({
                            firstname,
                            lastname,
                            email,
                            password:hash,
                            initials:firstname.charAt(0)+lastname.charAt(0)
                        })


                        user.save().then(()=>{
                            res.json({message:"Signup Success"})

                            const mailOptions={
                                to: req.body.email,
                                from:'noreply@coderstavern.com',
                                subject:'confirmation Email',
                                html:`<p>This is an Automated Email Just for confirmation .Please Do not respond to this Email</p>`
                            }

                            transport.sendMail(mailOptions,(err,info)=>{
                                if(err){
                                    console.log(err)
                                }
                                else{
                                    console.log(info)
                                }
                            })

                        }).catch(err=>{
                            res.json({message:"Signup Failed"})

                        })
                     }
                 })
                }

            })

         }
         
 
        }
 
    }).catch(err=>{
        res.json({message:err})
    })

   }



})

appRouter.post('/signin',(req,res)=>{
    const {email,password}=req.body
    if(!email || !password){
        res.json({message:"Please Enter all the credentials (email and password)"})
    }

    else{
      User.findOne({email:email}).then((data)=>{
          
          if(!data){
                res.json({message:"Email/Password is wrong"})
            }


            else{
                
                const {_id}=data._id
                bcrypt.compare(password,data.password,(err,isMatch)=>{
                    if(err){
                         res.json({message:"Something went wrong"})
                    }
                    else{
                        if(isMatch){
                           
                            const token=jwt.sign({_id},TOKEN_SECRET)
                            req.header=token
                            res.json({token:token})

                        }
                        else{
                            res.json({message:"Email/Password is Wrong"})
                        }
                    }
                })
            }
        }).catch(err=> res.json({message:"Something Went Wrong"}))
    }

})

appRouter.post('/forgotpassword',(req,res)=>{
   const {email}=req.body
   
   crypto.randomBytes(10,(err,buffer)=>{
       if(err){
           console.log(err)

       }
       else{
           const token=buffer.toString('hex')
        

           User.findOne({email:email}).then((data)=>{

            if(!data){
                res.json({error:"Email is Wrong Please Enter a Valid Email"})
            }

            else{
                console.log(new Date().getMinutes())
                console.log(new Date().setMinutes(1))
                console.log(new Date())

                data.userToken=token
                data.tokenExp=Date.now() + 1000
               

               data.save().then(()=>{
                   console.log('Data Saved Successfully')
               }).catch(err=>{
                   console.log('Error')
               })

                const mailOpts={
                    from:'d8861772715@gmail.com',
                    to:email,
                    subject:"Password Reset",
                    html:`<p>You Have Requested For Password Change</p>
                    <p>Please Click on the this <a href='http://localhost:3000/reset/${token    }'>link</a> to Reset Password</p>
                    <p>Thanks,
                    Support Team
                    </p>`
                }
             
                transport.sendMail(mailOpts,(err,info)=>{
                    if(err){
                        res.json({error:err})
                    }
                    else{
                        res.json({message:"Password Reset link has been Sent through Email"})
                    }
                })

          

            }
               
           }).catch((err)=>{
               console.log(err)
           })

       }

   })

})

appRouter.post('/resetpass',(req,res)=>{
    const{pass1,pass2,token}=req.body
    if(!pass1 || !pass2){
        res.json({error:"Please enter all the values"})
    }

    else{
        if(pass2!=pass1){
            res.json({error:"Passwords Do not Match"})
        }
        else{
         

        
                User.findOne({userToken:token}).then((data)=>{
                    if(Date.now() > tokenExp){
                        res.json({error:"Link Expired"})
                    }
                    else{
                        bcrypt.genSalt(10,(err,salt)=>{
                            bcrypt.hash(pass1,salt,(err,hash)=>{
                                if(err){
                                    res.send({error:"Something went wrong"})
                                }
                                else{
                                    data.password=hash
                                    data.userToken=""
                                    data.save().then(()=>{
                                        res.json({message:"Password updated successfully"})
                                    }).catch((err)=>{
                                        res.json({error:"Password Updation Failed"})
                                    })
        
                                }
                            })
                        })

                    }
             

        
                
                
               

            
            

                

            
            })

            
         
        }
    }
})




module.exports=appRouter