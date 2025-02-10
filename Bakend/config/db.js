const mongoose = require('mongoose')

const connectDB= async()=>{
         try {
                  await mongoose.connect("mongodb://localhost:27017/food-delivery")
                  console.log("Database Connected Successfully.");
                     
         } catch (error) {
                 console.log(error.message);
                  
         }
         
}
module.exports=connectDB