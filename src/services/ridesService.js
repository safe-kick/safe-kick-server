const pool = require("../config/db");

const startRide = async ({ userId, kickboardId, startedAt }) => {
  const result = await pool.query(
    `
    INSERT INTO rides (user_id, kickboard_id, started_at)
    VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP))
    RETURNING id, user_id, kickboard_id, started_at, ended_at, warning_count, created_at
    `,
    [userId, kickboardId, startedAt]
  );

  return result.rows[0];
};

const getRides = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      id,
      kickboard_id,
      started_at,
      ended_at,
      warning_count,
      created_at
    FROM rides
    WHERE user_id = $1
    ORDER BY started_at DESC
    `,
    [userId]
  );

  return result.rows;
};

const getRecentRides = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      kickboard_id,
      started_at,
      ended_at,
      warning_count
    FROM rides
    WHERE user_id = $1
    ORDER BY started_at DESC
    LIMIT 5
    `,
    [userId]
  );

  return result.rows;
};

const getRideDetail = async ({ userId, rideId }) => {
  const result = await pool.query(
    `
    SELECT
      id,
      kickboard_id,
      started_at,
      ended_at,
      warning_count,
      created_at
    FROM rides
    WHERE id = $1
      AND user_id = $2
    `,
    [rideId, userId]
  );

  return result.rows[0];
};

const endRide = async ({ userId, rideId, endedAt, warningCount }) => {
  const result = await pool.query(
    `
    UPDATE rides
    SET
      ended_at = COALESCE($1, CURRENT_TIMESTAMP),
      warning_count = $2
    WHERE id = $3
      AND user_id = $4
    RETURNING
      id,
      kickboard_id,
      started_at,
      ended_at,
      warning_count,
      created_at
    `,
    [
      endedAt,
      warningCount,
      rideId,
      userId
    ]
  );

  return result.rows[0];
};

module.exports = {
  startRide,
  getRides,
  getRecentRides,
  getRideDetail,
  endRide
};