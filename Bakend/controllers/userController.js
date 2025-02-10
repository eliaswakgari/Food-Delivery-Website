const userModel = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
//login user
const loginUser = async (req, res) => {
         const {email,password}=req.body
         try {
          const user=await userModel.findOne({email:email}) 
          //check existence of user
          if (!user) {
                  return res.status(404).json({success:false,message:"User does not exist"})
          }    
          //verify the password 
          const isMatch=await bcrypt.compare(password,user.password)
          if (!isMatch) {
             return res.status(401).json({success:false,message:"Wrong password"})     
          }
          //when user logged in the payload and secret key signed and stored in client storage like localstorage,session,cookie,but cookie and local storage for jwt 
          const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
          console.log(token.id);
          
          return res.status(201).json({success:true,token})
         } catch (error) {
                  console.log(error.message);
                return res.status(500).json({message:"Server error"})  
         }
     
};
//register user
const RegisterUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exist = await userModel.findOne({ email });
    //checking is user already exist?
    if (exist) {
      return res
        .status(409)
        .json({ success: false, message: "User Already exist" });
      //409 Conflict,user already exists in the database, and creating a duplicate user is not allowed.
    }
    //validating email format and strong password.
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter valid email address" });
    }
    //validating strong password
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter Strong password" });
    }
    //hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //create new object user(contains user data)
    const newUser =new userModel({
      name: name,
      email: email,
      password: hashedPassword,
    });
    const user = await newUser.save();
    // Signing the token
  //  const plainUser=user.toObject()
    //payload should be plain javascript object.
    const token = jwt.sign({id:user._id}, process.env.JWT_SECRET);
    console.log("token",token);
    
 return res.status(200).json({ success: true, token:token });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = { loginUser, RegisterUser };
