const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

// mongoose.connect(db) --> This will return a promise so we put await before it

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
