const express = require("express");
const mock = require("../mocks/users.mock.json");

const router = express.Router();

router.get("/me", (req, res) => {
  res.json(mock.me);
});

module.exports = router;