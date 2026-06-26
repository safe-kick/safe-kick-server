const express = require("express");
const mock = require("../mocks/session.mock.json");

const router = express.Router();

router.post("/start", (req, res) => {
  res.json(mock.start);
});

router.post("/end", (req, res) => {
  res.json(mock.end);
});

router.get("/summary", (req, res) => {
  res.json({
    ...mock.summary,
    data: {
      ...mock.summary.data,
      session_id: Number(req.query.session_id || mock.summary.data.session_id)
    }
  });
});

module.exports = router;