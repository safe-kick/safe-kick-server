const useMock = process.env.USE_MOCK === "false";

module.exports = useMock
  ? require("./authMockController")
  : require("./authDbController");