const foodModel = require("../models/foodModel.js");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary from environment variables if available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const addFood = async (req, res) => {
    // Debugging: Log the entire request body and files
    console.log('Request body:', req.body);
    console.log('Request file:', req.file); // This should show the uploaded file

    // Check if file is uploaded
    if (!req.file) {
        return res.status(400).json({ success:false, message: 'No image file uploaded' });
    }

    try {
        let imageUrl;
        const hasCloudinaryConfig = !!(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        );

        if (hasCloudinaryConfig) {
            // Use req.file.path which multer provides (absolute path)
            const localPath = req.file.path;
            
            // Check if file exists before uploading to Cloudinary
            if (!fs.existsSync(localPath)) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Uploaded file not found. Please try again.' 
                });
            }

            try {
                const uploadRes = await cloudinary.uploader.upload(localPath, {
                    folder: "food-items",
                });
                imageUrl = uploadRes.secure_url;

                // Clean up local file after successful upload
                fs.unlink(localPath, (err) => {
                    if (err) console.error('Error deleting local file:', err);
                });
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                // If Cloudinary fails, fall back to local file
                imageUrl = req.file.filename;
            }
        } else {
            // Fallback: keep using local filename
            imageUrl = req.file.filename;
        }

        // Create new food item
        const food = new foodModel({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: imageUrl,
        });

        await food.save();

        return res.status(201).json({ success: true, message: 'Food added' });
    } catch (error) {
        console.error('Error:', error.message);  // Log the error for debugging
        
        return res.status(500).json({ success: false, message: error.message });
    }
};
//list all food
const listFood=async(req,res)=>{
    try {
        const food=await foodModel.find({})
        return res.status(201).json({success:true,data:food})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:"Server Error"})
    }
}
//remove food from database
const removeFood=async(req,res)=>{
    try {
        const food=await foodModel.findById(req.body.id)
        if (!food) {
            return res.status(404).json({success:false,message:'Food item not found'})
        }
        
        // Only delete local file if it's not a Cloudinary URL (doesn't start with http)
        if (food.image && !food.image.startsWith('http')) {
            const imagePath = path.join(__dirname, '../uploads', food.image);
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) console.error('Error deleting image file:', err);
                });
            }
        }
        
        await foodModel.findByIdAndDelete(req.body.id)
        return res.status(201).json({success:true,message:'Food deleted successfully'})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:"Internal error"})
    }
}

module.exports = {addFood,listFood,removeFood};
