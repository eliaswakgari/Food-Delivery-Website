const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { addFood, listFood, removeFood } = require("../controllers/foodController");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/role");

const foodRouter = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

// Configure multer for file uploads (images go to /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Public: list all food items
foodRouter.get("/list", listFood);

// Admin-only: add and remove food (e.g. for admin panel)
foodRouter.post("/add", authMiddleware, requireRole("admin"), upload.single("image"), addFood);
foodRouter.post("/remove", authMiddleware, requireRole("admin"), removeFood);

module.exports = foodRouter;
