const express = require("express");
const mock = require("../mocks/rides.mock.json");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(mock.list);
});

router.post("/start", (req, res) => {
  res.json(mock.start);
});

router.get("/recent", (req, res) => {
  res.json(mock.recent);
});

router.get("/:rideId", (req, res) => {
  res.json({
    ...mock.detail,
    data: {
      ...mock.detail.data,
      ride_id: Number(req.params.rideId)
    }
  });
});

router.patch("/:rideId/end", (req, res) => {
  res.json({
    ...mock.end,
    data: {
      ...mock.end.data,
      ride_id: Number(req.params.rideId),
      ended_at: req.body.ended_at || mock.end.data.ended_at,
      warning_count: req.body.warning_count ?? mock.end.data.warning_count
    }
  });
});

module.exports = router;