const crypto = require("crypto");
const pool = require("../config/db");

const ALGORITHM = "aes-256-gcm";

const encryptionKey = () => {
  const encodedKey = process.env.FACE_EMBEDDING_ENCRYPTION_KEY;
  if (!encodedKey) {
    const error = new Error("FACE_EMBEDDING_ENCRYPTION_KEY가 설정되지 않았습니다.");
    error.code = "ENCRYPTION_KEY_NOT_CONFIGURED";
    throw error;
  }
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32) {
    const error = new Error("FACE_EMBEDDING_ENCRYPTION_KEY는 32바이트 Base64여야 합니다.");
    error.code = "INVALID_ENCRYPTION_KEY";
    throw error;
  }
  return key;
};

const serialize = (embedding) => {
  const buffer = Buffer.allocUnsafe(embedding.length * 4);
  embedding.forEach((value, index) => buffer.writeFloatLE(value, index * 4));
  return buffer;
};

const deserialize = (buffer, dimension) => {
  if (buffer.length !== dimension * 4) {
    throw new Error("저장된 얼굴 임베딩 크기가 올바르지 않습니다.");
  }
  return Array.from({ length: dimension }, (_, index) =>
    buffer.readFloatLE(index * 4));
};

const encrypt = (embedding, userId, modelName) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`${userId}:${modelName}:${embedding.length}`, "utf8"));
  const encrypted = Buffer.concat([cipher.update(serialize(embedding)), cipher.final()]);
  return { encrypted, iv, authTag: cipher.getAuthTag() };
};

const decrypt = (row) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey(), row.encryption_iv);
  decipher.setAAD(Buffer.from(`${row.user_id}:${row.model_name}:${row.dimension}`, "utf8"));
  decipher.setAuthTag(row.auth_tag);
  const plain = Buffer.concat([
    decipher.update(row.encrypted_embedding),
    decipher.final(),
  ]);
  return deserialize(plain, row.dimension);
};

exports.upsert = async ({ userId, embedding, modelName }) => {
  const user = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
  if (user.rows.length === 0) return null;
  const { encrypted, iv, authTag } = encrypt(embedding, userId, modelName);
  const result = await pool.query(
    `INSERT INTO face_embeddings (
       user_id, encrypted_embedding, encryption_iv, auth_tag, model_name, dimension
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       encrypted_embedding = EXCLUDED.encrypted_embedding,
       encryption_iv = EXCLUDED.encryption_iv,
       auth_tag = EXCLUDED.auth_tag,
       model_name = EXCLUDED.model_name,
       dimension = EXCLUDED.dimension,
       updated_at = CURRENT_TIMESTAMP
     RETURNING user_id, model_name, dimension, updated_at`,
    [userId, encrypted, iv, authTag, modelName, embedding.length],
  );
  return result.rows[0];
};

exports.getForActiveRide = async ({ userId, deviceId }) => {
  const result = await pool.query(
    `SELECT fe.user_id, fe.encrypted_embedding, fe.encryption_iv, fe.auth_tag,
            fe.model_name, fe.dimension
     FROM face_embeddings fe
     JOIN rides r ON r.user_id = fe.user_id AND r.ended_at IS NULL
     JOIN kickboards k ON k.public_id = r.kickboard_id
     WHERE fe.user_id = $1 AND k.device_id = $2
     ORDER BY r.started_at DESC
     LIMIT 1`,
    [userId, deviceId],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    user_id: row.user_id,
    embedding: decrypt(row),
    model_name: row.model_name,
    dimension: row.dimension,
  };
};

exports.remove = async (userId) => {
  const result = await pool.query(
    "DELETE FROM face_embeddings WHERE user_id = $1 RETURNING user_id",
    [userId],
  );
  return result.rowCount > 0;
};
