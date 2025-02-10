const express = require('express');
const multer = require('multer');
const {addFood,listFood,removeFood} = require('../controllers/foodController.js');

const foodRouter = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: 'uploads', // Directory to store uploaded files
    filename: (req, file, cb) => {
             console.log(req.file);
             
       return cb(null, `${Date.now()}-${file.originalname}`); // Ensure the filename is unique
    },
});

// Initialize multer with the configured storage
const upload = multer({ storage: storage,limits: { fileSize: 10 * 1024 * 1024 }});

// Define the route, ensure upload.single('image') is used as middleware
foodRouter.post('/add', upload.single('image'), addFood);
//route to find all list of foods
foodRouter.get('/list',listFood)
//route to delete food from database
foodRouter.post('/remove',removeFood)
module.exports = foodRouter;
