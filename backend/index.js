const express = require('express')     //framework for building web servers in Node.js
const mongoose = require('mongoose')    //used to connect & work with mongodb
const cors = require('cors')        //allows backend to be accessed from different frontend domains
const MindBloomModel = require('./models/Mindbloom')    // Importing our user model (schema) from models folder

//creating the express app
const app = express()
app.use(express.json()) // Middleware: allows the server to read JSON data from requests (req.body)
app.use(cors())         //allows cross-origin requests (React frontend can talk to backend)


//connecting mongodb using mongoose
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/MindBloom";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


  // Login API
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await MindBloomModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

  res.status(200).json({ message: "Login successful" });
});

// Register API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Validate email format
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }

    const user = await MindBloomModel.create({ name, email, password });
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Export app for tests
const server = app.listen(3001, () => {
  console.log("✅ Server running on port 3001");
});

module.exports = { app, server };
