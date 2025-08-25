const express = require('express')     //framework for building web servers in Node.js
const mongoose = require('mongoose')    //used to connect & work with mongodb
const cors = require('cors')        //allows backend to be accessed from different frontend domains
const MindBloomModel = require('./models/Mindbloom')    // Importing our user model (schema) from models folder

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');//******* */

//creating the express app
const app = express()
app.use(express.json()) // Middleware: allows the server to read JSON data from requests (req.body)
app.use(cors())         //allows cross-origin requests (React frontend can talk to backend)


//connecting mongodb using mongoose
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/MindBloom";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


  // Login API with token
  app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await MindBloomModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

   // Generate JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email },
    "your_secret_key",       // replace with an environment variable in real projects
    { expiresIn: "1h" }
  );

  res.status(200).json({ message: "Login successful", token });
});

// Register API
  app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Hash password*******************
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate email format
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }
    const user = await MindBloomModel.create({ name, email, password: hashedPassword });//********* */
   // const user = await MindBloomModel.create({ name, email, password });
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error("Register API error:", err); //********* */
    res.status(500).json({ message: err.message });
  }
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "your_secret_key"); // same secret as in login
    req.user = decoded; // attach decoded info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ----- GET User by ID route (Broken Access Control test) -----
 app.get('/api/users/:id', authenticate, async (req, res) => {
  const { id } = req.params

  // Only allow logged-in user to access their own data
  if (req.user.id !== id) {
    return res.status(403).json({ message: "Forbidden" })
  }

  try {
    const user = await MindBloomModel.findById(id).select('-password')
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (err) {
    console.error("Get User API error:", err); //*********** */
    res.status(500).json({ message: err.message })
  }
});


// Export app for tests
const server = app.listen(3001, () => {
  console.log("✅ Server running on port 3001");
});

module.exports = { app, server };
