//server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Static frontend
app.use(express.static(path.join(__dirname, "public")));

// ✅ Routes
const recipeRoutes = require("./routes/recipes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

app.use("/api/recipes", recipeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ✅ Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Flavor Table API is running ✅" });
});

// ✅ Run server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
