const mock = require("../mocks/rides.mock.json");

exports.startRide = (req, res) => {
  res.json(mock.startRide);
};