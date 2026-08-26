const pool = require("../config/db");

/**
 * 컨트롤러에서 구분할 수 있는
 * 서비스 오류를 만든다.
 */
const createServiceError = (code, message) => {
  const error = new Error(message);
  error.code = code;

  return error;
};


/**
 * 운행 시작
 */
const startRide = async ({
  userId,
  kickboardId,
  startedAt,
}) => {
  const allowConcurrentRides =
    process.env.ALLOW_CONCURRENT_RIDES === "true";
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * 같은 사용자가 동시에 여러 번
     * 운행 시작 요청을 보내는 것을 방지한다.
     */
    await client.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId],
    );

    /*
     * 사용자가 이미 진행 중인 운행이 있는지 확인
     */
    const activeRideResult =
      await client.query(
        `
        SELECT id
        FROM rides
        WHERE user_id = $1
          AND ended_at IS NULL
        LIMIT 1
        `,
        [userId],
      );

    if (
      activeRideResult.rows.length > 0 &&
      !allowConcurrentRides
    ) {
      throw createServiceError(
        "ACTIVE_RIDE_EXISTS",
        "이미 진행 중인 운행이 있습니다.",
      );
    }

    /*
     * QR에서 받은 kickboard_id로
     * 등록된 킥보드 조회
     */
    const kickboardResult =
      await client.query(
        `
        SELECT
          id,
          public_id,
          status
        FROM kickboards
        WHERE public_id = $1
        FOR UPDATE
        `,
        [kickboardId],
      );

    if (kickboardResult.rows.length === 0) {
      throw createServiceError(
        "KICKBOARD_NOT_FOUND",
        "등록되지 않은 킥보드입니다.",
      );
    }

    const kickboard =
      kickboardResult.rows[0];

    /*
     * 사용 가능한 킥보드인지 확인
     */
    if (
      kickboard.status !== "available" &&
      !allowConcurrentRides
    ) {
      throw createServiceError(
        "KICKBOARD_NOT_AVAILABLE",
        "현재 사용할 수 없는 킥보드입니다.",
      );
    }

    if (
      allowConcurrentRides &&
      (activeRideResult.rows.length > 0 ||
        kickboard.status !== "available")
    ) {
      console.warn(
        "[RIDE START][TEST BYPASS] 기존 운행/킥보드 상태 제한을 우회합니다.",
        {
          userId,
          kickboardId,
          kickboardStatus: kickboard.status,
          activeRideId:
            activeRideResult.rows[0]?.id ?? null,
        },
      );
    }

    /*
     * 운행 기록 생성
     */
    const rideResult =
      await client.query(
        `
        INSERT INTO rides (
          user_id,
          kickboard_id,
          started_at
        )
        VALUES (
          $1,
          $2,
          COALESCE($3, CURRENT_TIMESTAMP)
        )
        RETURNING
          id,
          user_id,
          kickboard_id,
          started_at,
          ended_at,
          warning_count,
          created_at
        `,
        [
          userId,
          kickboardId,
          startedAt ?? null,
        ],
      );

    /*
     * 킥보드 상태를 사용 중으로 변경
     */
    await client.query(
      `
      UPDATE kickboards
      SET status = 'in_use'
      WHERE public_id = $1
      `,
      [kickboardId],
    );

    await client.query("COMMIT");

    return rideResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};


/**
 * 전체 운행 기록 조회
 */
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
    [userId],
  );

  return result.rows;
};


/**
 * 최근 운행 기록 조회
 */
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
    [userId],
  );

  return result.rows;
};


/**
 * 운행 상세 조회
 */
const getRideDetail = async ({
  userId,
  rideId,
}) => {
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
    [
      rideId,
      userId,
    ],
  );

  return result.rows[0];
};

/**
 * 현재 사용자의 진행 중인 운행 조회
 */
const getActiveRide = async (userId) => {
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
      AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1
    `,
    [userId],
  );

  return result.rows[0];
};

/**
 * 운행 종료
 */
const endRide = async ({
  userId,
  rideId,
  endedAt,
  warningCount,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * 종료할 운행 조회
     *
     * 다른 사용자의 운행은 조회되지 않는다.
     */
    const rideResult =
      await client.query(
        `
        SELECT
          id,
          user_id,
          kickboard_id,
          started_at,
          ended_at,
          warning_count,
          created_at
        FROM rides
        WHERE id = $1
          AND user_id = $2
        FOR UPDATE
        `,
        [
          rideId,
          userId,
        ],
      );

    /*
     * 해당 운행이 없는 경우
     */
    if (rideResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return undefined;
    }

    const ride = rideResult.rows[0];

    /*
     * 이미 종료된 운행인지 확인
     */
    if (ride.ended_at !== null) {
      throw createServiceError(
        "RIDE_ALREADY_ENDED",
        "이미 종료된 운행입니다.",
      );
    }

    /*
     * 운행 종료 처리
     */
    const updatedRideResult =
      await client.query(
        `
        UPDATE rides
        SET
          ended_at =
            COALESCE(
              $1,
              CURRENT_TIMESTAMP
            ),
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
          endedAt ?? null,
          warningCount ?? 0,
          rideId,
          userId,
        ],
      );

    /*
     * 킥보드를 다시 사용 가능 상태로 변경
     *
     * 현재는 rides와 kickboards 사이에
     * 외래키를 적용하지 않았으므로,
     * 해당 킥보드가 없더라도 운행 종료는 진행한다.
     */
    await client.query(
      `
      UPDATE kickboards
      SET status = 'available'
      WHERE public_id = $1
      `,
      [ride.kickboard_id],
    );

    await client.query("COMMIT");

    return updatedRideResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};


module.exports = {
  startRide,
  getRides,
  getRecentRides,
  getActiveRide,
  getRideDetail,
  endRide,
};
