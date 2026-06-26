const express = require("express");
const mock = require("../mocks/session.mock.json");

const router = express.Router();

router.get("/status", (req, res) => {
  res.json(mock.status);
});

router.post("/lock", (req, res) => {
  res.json({
    ...mock.lock,
    data: {
      ...mock.lock.data,
      session_id: req.body.session_id || mock.lock.data.session_id,
      reason: req.body.reason || mock.lock.data.reason
    }
  });
});

router.post("/unlock", (req, res) => {
  res.json({
    ...mock.unlock,
    data: {
      ...mock.unlock.data,
      session_id: req.body.session_id || mock.unlock.data.session_id
    }
  });
});

module.exports = router;