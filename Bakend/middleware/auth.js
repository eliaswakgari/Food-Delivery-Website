const jwt = require('jsonwebtoken')

const authMiddleware=async(req,res,next)=>{
         //extract token from headers when user logged in
     const {token}=req.headers
        if (!token) {
         return res.status(401).json({success:false,message:"Not Authorized login again "})
        } 
        try {
                 //verify the token and extract payload data from token
         const decode_token=jwt.verify(token,process.env.JWT_SECRET)
         //attaches the user's ID to req.body.userId, making it accessible to subsequent middleware or route handlers.
         req.body.userId=decode_token.id
         console.log(req.body.userId);
         
         next()
         
        } catch (error) {
         return  res.status(500).json({success:false,message:"Internal error"})
        }
}

module.exports=authMiddleware