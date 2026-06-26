const express = require("express");
const cors = require("cors");

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

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/rides", ridesRoutes);
app.use("/session", sessionRoutes);

app.use("/", kickboardRoutes);

module.exports = app;