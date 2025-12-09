const express = require("express");
const multer = require("multer");
const path = require("path");
const { addFood, listFood, removeFood } = require("../controllers/foodController");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/role");

const foodRouter = express.Router();

// Configure multer for file uploads (images go to /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
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
