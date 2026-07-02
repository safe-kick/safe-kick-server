const useMock = process.env.USE_MOCK === "true";

module.exports = useMock
  ? require("./usersMockController")
  : require("./usersDbController");