const express = require("express");
const ridesController = require("../controllers/ridesController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, ridesController.getRides);

router.post("/start", authMiddleware, ridesController.startRide);

router.get("/recent", authMiddleware, ridesController.getRecentRides);

/*
 * 반드시 /:rideId보다 위에 위치해야 한다.
 */
router.get(
  "/active",
  authMiddleware,
  ridesController.getActiveRide,
);

router.get("/:rideId", authMiddleware, ridesController.getRideDetail);

router.patch("/:rideId/end", authMiddleware, ridesController.endRide);

module.exports = router;