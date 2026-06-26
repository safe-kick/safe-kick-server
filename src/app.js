const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const ridesRoutes = require("./routes/rides");
const sessionRoutes = require("./routes/session");
const kickboardRoutes = require("./routes/kickboard");


const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "success",
    data: {
      server: "safe-kick-server",
      mode: "mock"
    },
    message: "Safe Kick mock server is running"
  });
});

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      db: 'error',
      message: err.message,
    });
  }
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/rides", ridesRoutes);
app.use("/session", sessionRoutes);

app.use("/", kickboardRoutes);

module.exports = app;