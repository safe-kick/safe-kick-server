const pool = require("../config/db");

const getMe = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      u.created_at,
      l.license_no,
      l.expires_at
    FROM users u
    LEFT JOIN licenses l ON u.id = l.user_id
    WHERE u.id = $1
    `,
    [userId]
  );

  return result.rows[0];
};

module.exports = {
  getMe,
};
