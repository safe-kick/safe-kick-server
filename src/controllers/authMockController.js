const mock = require("../mocks/auth.mock.json");

exports.register = (req, res) => {
  res.json(mock.register);
};

exports.login = (req, res) => {
  res.json(mock.login);
};

exports.faceVerify = (req, res) => {
  res.json(mock.faceVerifySuccess);
};