const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const userRouter = require("./routes/userRoute");
const foodRouter = require("./routes/foodRoute");
const cartRouter = require("./routes/cartRoute");
const orderRouter = require("./routes/orderRoute");
const { webhookHandler } = require("./controllers/orderController");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Normalize allowed frontend origins (comma-separated in env for production)
const rawOrigins = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Create Socket.IO server
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
  });
});

// Middleware
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

// Stripe webhook must use raw body (no JSON parsing)
app.post("/api/order/webhook", express.raw({ type: "application/json" }), webhookHandler);

// Attach io to req for normal JSON routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Normal JSON body parsing for other routes
app.use(bodyParser.json());

// Static files for uploaded images (used by frontend as url + "/images/" + item.image)
app.use("/images", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/user", userRouter);
app.use("/api/food", foodRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

// Serve built frontend in production
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  // Simple health check for development
  app.get("/", (req, res) => {
    res.send("Food delivery backend is running");
  });
}

// Start server after DB connection
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server (with Socket.IO) running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
  });
