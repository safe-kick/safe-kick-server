const express = require("express");
const controller = require("../controllers/faceEmbeddingsController");
const internalApiMiddleware = require("../middlewares/internalApiMiddleware");

const router = express.Router();
router.use(internalApiMiddleware);
router.put("/:userId", controller.upsert);
router.get("/:userId", controller.getForVerification);
router.delete("/:userId", controller.remove);

module.exports = router;
