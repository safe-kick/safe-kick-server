const mock = require("../mocks/auth.mock.json");
const jwt = require("jsonwebtoken");

const createMockToken = () => {
  const user = mock.login.data.user;

  return jwt.sign(
    {
      user_id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

exports.register = (req, res) => {
  res.json({
    ...mock.register,
    data: {
      ...mock.register.data,
      token: createMockToken(),
    },
  });
};

exports.login = (req, res) => {
  res.json({
    ...mock.login,
    data: {
      ...mock.login.data,
      token: createMockToken(),
    },
  });
};

exports.faceVerify = (req, res) => {
  res.json(mock.faceVerifySuccess);
};
