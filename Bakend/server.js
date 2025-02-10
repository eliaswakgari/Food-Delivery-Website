const express = require('express')
const connectDB = require('./config/db')
const cors = require('cors')
const foodRouter = require('./routes/foodRoute')
const userRouter = require('./routes/userRoute')
const cartRouter = require('./routes/cartRoute')
const bodyParser = require('body-parser')
const orderRouter = require('./routes/orderRoute')
require('dotenv').config()
 
//app config
const app = express()
const port = process.env.PORT || 4001
//middleware
app.use(express.urlencoded({extended:true}))
 
app.use(cors())
app.use(express.json())
 app.use(bodyParser.urlencoded())

//db connection
connectDB()
//api endpoints
app.use("/api/food",foodRouter)
app.use("/images",express.static("uploads"))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
//route
app.get('/' , (req , res)=>{

   res.send('API Working well')

})


app.listen(port , ()=> console.log('> Server is up and running on port : ' + port))