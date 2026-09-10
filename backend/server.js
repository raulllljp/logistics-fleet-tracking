require("dotenv").config();

const express = require("express");
const cors = require("cors");
const corsOptions = require("./config/cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const tripRoutes = require("./routes/tripRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors(corsOptions()));
app.use(express.json());
app.use((req, res, next) => {
  req.url = req.url.replace(/(%0A|%0D|%20|\r|\n|\s)+$/gi, "").trim();
  next();
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logistics Fleet Tracking Backend API is active.",
    healthCheck: "http://localhost:5000/api/health",
    frontendUrl: "http://localhost:5173",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logistics Fleet Tracking API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    const addr = server.address();
    const port = addr && typeof addr === "object" ? addr.port : PORT;
    console.log(`Server running on port ${port}`);
  });

  server.on("error", (error) => {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = app;
