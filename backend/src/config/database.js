const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn("⚠️  MongoDB URI not found in environment variables");
      console.warn("⚠️  Server will run without database connection");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    console.error(`⚠️  Server will continue without database connection`);
    console.error(`⚠️  Make sure MongoDB is running: mongod`);
    // Don't exit process, allow server to start
  }
};

module.exports = connectDB;
