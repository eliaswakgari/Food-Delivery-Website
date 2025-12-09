const jwt = require('jsonwebtoken')

const authMiddleware=async(req,res,next)=>{
         //extract token from headers when user logged in
     let {token}=req.headers
     if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
         token = req.headers.authorization.split(' ')[1]
     }
     if (!token && req.headers.cookie) {
         const found = req.headers.cookie
           .split(';')
           .map(c => c.trim())
           .find(c => c.startsWith('fd_token='))
         if (found) {
             token = decodeURIComponent(found.split('=')[1] || '')
         }
     }
     if (!token) {
         return res.status(401).json({success:false,message:"Not Authorized login again "})
     } 
     try {
         //verify the token and extract payload data from token
         const decode_token=jwt.verify(token,process.env.JWT_SECRET)
         //attaches the user's ID to req.body.userId, making it accessible to subsequent middleware or route handlers.
         req.body.userId=decode_token.id
         req.userRole = decode_token.role
         req.user = { id: decode_token.id, role: decode_token.role }
         console.log(req.body.userId);
         
         next()
         
     } catch (error) {
         return  res.status(401).json({success:false,message:"Invalid token"})
     }
}

module.exports=authMiddleware