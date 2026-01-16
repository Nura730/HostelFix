const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaint");
const adminRoutes = require("./routes/admin");
const notifyRoutes = require("./routes/notification");
const profileRoutes = require("./routes/profile");

const app = express();

app.use(cors());
app.use(express.json());

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/complaint", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notifyRoutes);
app.use("/api/profile", profileRoutes);

/* STATIC */
app.use("/uploads", express.static("uploads"));

const PORT = 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
