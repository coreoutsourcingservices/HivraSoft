import mongoose from "mongoose";

const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI missing hai .env me");
  }

  console.log("⏳ MongoDB connect kar raha hu...");

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  console.log("✅ MongoDB connected successfully");
};

export default connectDatabase;