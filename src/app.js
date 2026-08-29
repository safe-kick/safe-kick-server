const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const ridesRoutes = require("./routes/rides");
const sessionRoutes = require("./routes/session");
const kickboardRoutes = require("./routes/kickboard");
const kickboardsRouter = require("./routes/kickboards");
const internalFaceEmbeddingsRoutes = require("./routes/internalFaceEmbeddings");


const app = express();

app.use(cors());

// Base64 이미지나 비교적 큰 JSON 요청을 받을 수 있도록 크기 제한 확대
app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.get("/health", (req, res) => {
  const mode = process.env.USE_MOCK === "true" ? "mock" : "database";

  res.json({
    status: "success",
    data: {
      server: "safe-kick-server",
      mode,
    },
    message: `Safe Kick ${mode} server is running`,
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
app.use("/kickboards", kickboardsRouter,);
app.use("/internal/face-embeddings", internalFaceEmbeddingsRoutes);

app.use("/", kickboardRoutes);

module.exports = app;
