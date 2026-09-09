require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Driver = require("./models/Driver");
const Vehicle = require("./models/Vehicle");
const connectDB = require("./config/db");

const seed = async () => {
  await connectDB();
  console.log("\n=== Seeding database ===\n");

  // 1. Create dispatcher account
  const dispatcherEmail = "dispatcher@fleetline.com";
  let dispatcher = await User.findOne({ email: dispatcherEmail });
  if (!dispatcher) {
    const passwordHash = await bcrypt.hash("Dispatcher123!", 12);
    dispatcher = await User.create({ name: "Fleet Dispatcher", email: dispatcherEmail, passwordHash, role: "dispatcher" });
    console.log("Created dispatcher:", dispatcherEmail);
  } else {
    console.log("Dispatcher already exists:", dispatcherEmail);
  }

  // 2. Create admin account
  const adminEmail = "admin@fleetline.com";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash("Admin123!", 12);
    admin = await User.create({ name: "Fleet Admin", email: adminEmail, passwordHash, role: "admin" });
    console.log("Created admin:", adminEmail);
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  // 3. Create vehicles
  const vehicleData = [
    { registrationNumber: "TN01AB1234", type: "van", capacity: 500 },
    { registrationNumber: "TN02CD5678", type: "truck", capacity: 2000 },
    { registrationNumber: "MH01EF9012", type: "mini_truck", capacity: 1000 },
  ];

  for (const v of vehicleData) {
    const existing = await Vehicle.findOne({ registrationNumber: v.registrationNumber });
    if (!existing) {
      await Vehicle.create({ ...v, status: "available" });
      console.log("Created vehicle:", v.registrationNumber, "("+v.type+")");
    } else {
      console.log("Vehicle already exists:", v.registrationNumber);
    }
  }

  // 4. Create driver profile for test driver if account exists
  const driverEmail = "testdriver123@test.com";
  const driverUser = await User.findOne({ email: driverEmail });
  if (driverUser) {
    const existingProfile = await Driver.findOne({ userId: driverUser._id });
    if (!existingProfile) {
      await Driver.create({
        userId: driverUser._id,
        licenseNumber: "TN0120260001",
        phone: "+91-9876543210",
        vehicleId: null,
        isAvailable: true,
      });
      console.log("Created driver profile for:", driverEmail);
    } else {
      console.log("Driver profile already exists for:", driverEmail);
    }
  } else {
    console.log("Test driver not found:", driverEmail, "- register first then re-run");
  }

  console.log("\n=== Seed complete ===");
  console.log("Dispatcher: dispatcher@fleetline.com / Dispatcher123!");
  console.log("Admin:      admin@fleetline.com / Admin123!");
  console.log("Customer:   testcustomer123@test.com / Password123!");
  console.log("Driver:     testdriver123@test.com / Password123!");
  await mongoose.disconnect();
};

seed().catch(error => {
  console.error("Seed error:", error.message);
  process.exit(1);
});
