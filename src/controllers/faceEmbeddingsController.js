const faceEmbeddingsService = require("../services/faceEmbeddingsService");
const FACE_MODEL_NAME = "buffalo_sc";
const FACE_EMBEDDING_DIMENSION = 512;

const parseUserId = (value) => {
  const userId = Number(value);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
};

exports.upsert = async (req, res) => {
  try {
    const userId = parseUserId(req.params.userId);
    const { embedding, model_name: modelName } = req.body;
    if (!userId || !Array.isArray(embedding) ||
        embedding.length !== FACE_EMBEDDING_DIMENSION ||
        embedding.some((value) => typeof value !== "number" || !Number.isFinite(value)) ||
        modelName !== FACE_MODEL_NAME) {
      return res.status(400).json({ status: "error", data: null, message: "임베딩 데이터가 올바르지 않습니다." });
    }
    const saved = await faceEmbeddingsService.upsert({ userId, embedding, modelName: modelName.trim() });
    if (!saved) {
      return res.status(404).json({ status: "error", data: null, message: "사용자를 찾을 수 없습니다." });
    }
    return res.status(200).json({ status: "success", data: saved, message: "얼굴 임베딩을 암호화해 저장했습니다." });
  } catch (error) {
    console.error("[FACE EMBEDDING] 저장 실패:", error);
    return res.status(500).json({ status: "error", data: null, message: "얼굴 임베딩 저장에 실패했습니다." });
  }
};

exports.getForVerification = async (req, res) => {
  try {
    const userId = parseUserId(req.params.userId);
    const deviceId = req.get("x-device-id");
    if (!userId || !deviceId) {
      return res.status(400).json({ status: "error", data: null, message: "userId와 X-Device-Id가 필요합니다." });
    }
    const data = await faceEmbeddingsService.getForActiveRide({ userId, deviceId });
    if (!data) {
      return res.status(404).json({ status: "error", data: null, message: "이 장비에서 인증 가능한 활성 운행 또는 임베딩이 없습니다." });
    }
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ status: "success", data, message: "얼굴 임베딩을 조회했습니다." });
  } catch (error) {
    console.error("[FACE EMBEDDING] 조회 실패:", error);
    return res.status(500).json({ status: "error", data: null, message: "얼굴 임베딩 조회에 실패했습니다." });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = parseUserId(req.params.userId);
    if (!userId) return res.status(400).json({ status: "error", data: null, message: "userId가 올바르지 않습니다." });
    const deleted = await faceEmbeddingsService.remove(userId);
    return res.status(200).json({ status: "success", data: { user_id: userId, deleted }, message: deleted ? "얼굴 임베딩을 삭제했습니다." : "저장된 얼굴 임베딩이 없습니다." });
  } catch (error) {
    console.error("[FACE EMBEDDING] 삭제 실패:", error);
    return res.status(500).json({ status: "error", data: null, message: "얼굴 임베딩 삭제에 실패했습니다." });
  }
};
