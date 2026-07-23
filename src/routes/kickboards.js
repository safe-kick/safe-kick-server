const express = require("express");

const kickboardsController =
  require("../controllers/kickboardsController");

const authMiddleware =
  require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * QR로 선택한 킥보드 상태 확인
 */
router.get(
  "/:publicId",
  authMiddleware,
  kickboardsController.getKickboard,
);

module.exports = router;