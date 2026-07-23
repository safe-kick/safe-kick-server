const pool = require("../config/db");

/**
 * 공개 킥보드 ID로 킥보드를 조회한다.
 */
const getKickboardByPublicId = async (
  publicId,
) => {
  const result = await pool.query(
    `
    SELECT
      id,
      public_id,
      status,
      created_at
    FROM kickboards
    WHERE public_id = $1
    `,
    [publicId],
  );

  return result.rows[0];
};

module.exports = {
  getKickboardByPublicId,
};