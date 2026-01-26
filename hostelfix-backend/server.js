const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaint");
const adminRoutes = require("./routes/admin");
const notifyRoutes = require("./routes/notification");
const profileRoutes = require("./routes/profile");
const statsRoutes = require("./routes/stats");

// Middleware
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

/* ================= SECURITY MIDDLEWARE ================= */

// Helmet - security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS - allow frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting - prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { success: false, msg: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 login attempts per 15 min
  message: {
    success: false,
    msg: "Too many login attempts, please try again later",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/admin/login", authLimiter);

/* ================= PARSING MIDDLEWARE ================= */

app.use(compression()); // Compress responses
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging (skip in test mode)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

/* ================= STATIC FILES ================= */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= API ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/complaint", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notifyRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/stats", statsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    msg: "HostelFix API is running",
    timestamp: new Date().toISOString(),
  });
});

/* ================= ERROR HANDLING ================= */

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, msg: "Route not found" });
});

// Global error handler
app.use(errorHandler);

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
