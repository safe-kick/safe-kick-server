const useMock = process.env.USE_MOCK === "true";

console.log("USE_MOCK =", process.env.USE_MOCK);
console.log("Controller =", useMock ? "Mock" : "DB");

module.exports = useMock
  ? require("./authMockController")
  : require("./authDbController");