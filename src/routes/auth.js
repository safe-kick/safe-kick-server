const express = require("express");
const mock = require("../mocks/auth.mock.json");

const router = express.Router();

router.post("/register", (req, res) => {
  res.json(mock.register);
});

router.post("/login", (req, res) => {
  res.json(mock.login);
});

router.post("/face-verify", (req, res) => {
  res.json(mock.faceVerifySuccess);
});

module.exports = router;