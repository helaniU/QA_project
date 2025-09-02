const express = require('express')     //framework for building web servers in Node.js
const mongoose = require('mongoose')    //used to connect & work with mongodb
const cors = require('cors')        //allows backend to be accessed from different frontend domains
const testModel = require('./models/test')    // Importing our user model (schema) from models folder

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');//******* */

let server;

//creating the express app
const app = express()
app.disable("x-powered-by");

app.use(express.json()) // Middleware: allows the server to read JSON data from requests (req.body)
app.use(cors({
  origin: "http://localhost:5173",  // <-- match my frontend port
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));        //allows cross-origin requests (React frontend can talk to backend)

require("dotenv").config();

//connecting mongodb using mongoose
mongoose.connect("mongodb://localhost:27017/test")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Login API with token
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await testModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
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

    // // Validate password strength (new)
    // if (password.length < 8) {
    //   return res.status(400).json({ message: "Password must be at least 8 characters long" });
    // }

    // // Optional: validate password complexity (letters + numbers)
    // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    // if (!passwordRegex.test(password)) {
    //   return res.status(400).json({ message: "Password must contain letters and numbers" });
    // }

    // Validate email format
    if (!email.includes("@")) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Hash password*******************
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await testModel.create({
      name,
      email,
      password: hashedPassword  // save hashed version in DB
    });//********* */
    // const user = await testModel.create({ name, email, password });
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
  const decoded = jwt.verify(token, "your_secret_key");
  //const decoded = jwt.verify(token, process.env.JWT_SECRET);// uncomment to show pass in sonarqube
  req.user = decoded; 
  next();
  } catch (err) {
  return res.status(401).json({ message: "Invalid token" });
  }

  /*
  try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
  req.user = decoded; 
  next();
  } catch (err) {
  console.error("JWT verification failed:", err); // log full error
  // Pass error to a global error handler instead of swallowing it
  return res.status(401).json({ 
    message: "Invalid or expired token", 
    error: err.message 
    });
  }
    */
// errorHandler.js
function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong" });
}

module.exports = errorHandler;



};

// ----- GET User by ID route (Broken Access Control test) -----
app.get('/api/users/:id', authenticate, async (req, res) => {
  const { id } = req.params

  // Only allow logged-in user to access their own data
  if (req.user.id !== id) {
    return res.status(403).json({ message: "Forbidden" })
  }

  try {
    const user = await testModel.findById(id).select('-password')
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (err) {
    console.error("Get User API error:", err); //*********** */
    res.status(500).json({ message: err.message })
  }
});


// Export app for tests
if (require.main === module) {
  const server = app.listen(3001, () => {
    console.log("✅ Server running on port 3001");
  });
}

module.exports = { app, server}; 
