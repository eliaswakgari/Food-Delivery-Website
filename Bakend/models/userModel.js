const mongoose = require('mongoose')
const { trim } = require('validator')
 const userSchema=new mongoose.Schema({
        name:{
                 type:String,required:true,trim:true
        },email:{
         type:String,required:true,unique:true,trim:true
},password:{
         type:String,required:true,trim:true
},cartData:{
         type:Object,default:{}
}
},{minimize:true})
const userModel= mongoose.model('user',userSchema)
 module.exports=userModel