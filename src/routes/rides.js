const express = require("express");
const ridesController = require("../controllers/ridesController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, ridesController.getRides);

router.post("/start", authMiddleware, ridesController.startRide);

router.get("/recent", authMiddleware, ridesController.getRecentRides);

router.get("/:rideId", authMiddleware, ridesController.getRideDetail);

router.patch("/:rideId/end", authMiddleware, ridesController.endRide);

module.exports = router;