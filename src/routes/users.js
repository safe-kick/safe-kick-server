const express = require("express");
const usersController = require("../controllers/usersController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, usersController.getMe);

module.exports = router;