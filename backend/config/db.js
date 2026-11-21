const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️  MONGO_URI is not set. Server is running without an active database connection.');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;
