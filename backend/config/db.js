const mongoose = require("mongoose");

const connectDB = async () => {
	const mongoUri = process.env.MONGO_URI;

	if (!mongoUri) {
		console.warn("MongoDB is not configured yet. Skipping database connection.");
		return;
	}

	try {
		await mongoose.connect(mongoUri);
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error(`MongoDB connection failed: ${error.message}`);
	}
};

module.exports = connectDB;
