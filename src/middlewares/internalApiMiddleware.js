const crypto = require("crypto");

const safeEqual = (actual, expected) => {
  const actualBuffer = Buffer.from(actual || "", "utf8");
  const expectedBuffer = Buffer.from(expected || "", "utf8");
  return actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

module.exports = (req, res, next) => {
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (!expectedKey) {
    return res.status(503).json({
      status: "error",
      data: null,
      message: "INTERNAL_API_KEY가 설정되지 않았습니다.",
    });
  }

  if (!safeEqual(req.get("x-internal-api-key"), expectedKey)) {
    return res.status(401).json({
      status: "error",
      data: null,
      message: "내부 API 인증에 실패했습니다.",
    });
  }
  next();
};
