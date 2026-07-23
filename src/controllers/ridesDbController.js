const ridesService = require("../services/ridesService");

exports.getRides = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const rides = await ridesService.getRides(userId);

    return res.status(200).json({
      status: "success",
      data: rides.map((ride) => ({
        ride_id: ride.id,
        kickboard_id: ride.kickboard_id,
        started_at: ride.started_at,
        ended_at: ride.ended_at,
        warning_count: ride.warning_count,
      })),
      message: "운행 기록 목록 조회에 성공했습니다.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "error",
      data: null,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

exports.startRide = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { kickboard_id, started_at } = req.body;

    if (!kickboard_id) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "kickboard_id는 필수입니다.",
      });
    }

    const ride = await ridesService.startRide({
      userId,
      kickboardId: kickboard_id,
      startedAt: started_at,
    });

    return res.status(200).json({
      status: "success",
      data: {
        ride_id: ride.id,
        kickboard_id: ride.kickboard_id,
        started_at: ride.started_at,
      },
      message: "운행 시작 기록이 생성되었습니다.",
    });
  } catch (err) {
    console.error(err);

    if (err.code === "KICKBOARD_NOT_FOUND") {
      return res.status(404).json({
        status: "error",
        data: null,
        message: "등록되지 않은 킥보드입니다.",
      });
    }

    if (
      err.code ===
      "KICKBOARD_NOT_AVAILABLE"
    ) {
      return res.status(409).json({
        status: "error",
        data: null,
        message:
          "현재 사용할 수 없는 킥보드입니다.",
      });
    }

    if (
      err.code ===
      "ACTIVE_RIDE_EXISTS"
    ) {
      return res.status(409).json({
        status: "error",
        data: null,
        message:
          "이미 진행 중인 운행이 있습니다.",
      });
    }

    return res.status(500).json({
      status: "error",
      data: null,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

/**
 * 현재 로그인 사용자의
 * 진행 중인 운행 조회
 */
exports.getActiveRide = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const ride =
      await ridesService.getActiveRide(
        userId,
      );

    /*
     * 진행 중인 운행이 없는 경우
     *
     * 오류가 아니므로 200과 data:null을 반환한다.
     */
    if (!ride) {
      return res.status(200).json({
        status: "success",
        data: null,
        message:
          "진행 중인 운행이 없습니다.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        ride_id: ride.id,
        kickboard_id:
          ride.kickboard_id,
        started_at:
          ride.started_at,
        ended_at:
          ride.ended_at,
        warning_count:
          ride.warning_count,
      },
      message:
        "진행 중인 운행 조회에 성공했습니다.",
    });

  } catch (err) {
    console.error(
      "[RIDE] 진행 중인 운행 조회 실패:",
      err,
    );

    return res.status(500).json({
      status: "error",
      data: null,
      message:
        "서버 오류가 발생했습니다.",
    });
  }
};

exports.getRecentRides = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const rides = await ridesService.getRecentRides(userId);

    return res.status(200).json({
      status: "success",
      data: rides.map((ride) => ({
        ride_id: ride.id,
        kickboard_id: ride.kickboard_id,
        started_at: ride.started_at,
        ended_at: ride.ended_at,
        warning_count: ride.warning_count,
      })),
      message: "최근 이용 기록 조회에 성공했습니다.",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "error",
      data: null,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

exports.getRideDetail = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const rideId = Number(req.params.rideId);

    if (!rideId) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "rideId가 올바르지 않습니다.",
      });
    }

    const ride = await ridesService.getRideDetail({
      userId,
      rideId,
    });

    if (!ride) {
      return res.status(404).json({
        status: "error",
        data: null,
        message: "해당 운행 기록을 찾을 수 없습니다.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        ride_id: ride.id,
        kickboard_id: ride.kickboard_id,
        started_at: ride.started_at,
        ended_at: ride.ended_at,
        warning_count: ride.warning_count,
        created_at: ride.created_at,
      },
      message: "운행 상세 조회에 성공했습니다.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      status: "error",
      data: null,
      message: "서버 오류가 발생했습니다.",
    });
  }
};

exports.endRide = async (req, res) => {

    try {

        const userId = req.user.user_id;
        const rideId = Number(req.params.rideId);

        const {
            ended_at,
            warning_count
        } = req.body;

        const ride = await ridesService.endRide({

            userId,
            rideId,
            endedAt: ended_at,
            warningCount: warning_count ?? 0

        });

        if (!ride) {

            return res.status(404).json({

                status: "error",
                data: null,
                message: "운행 기록을 찾을 수 없습니다."

            });

        }

        return res.status(200).json({

            status: "success",
            data: {

                ride_id: ride.id,
                ended_at: ride.ended_at,
                warning_count: ride.warning_count

            },
            message: "운행이 종료되었습니다."

        });

    }
    catch (err) {
      console.error(err);

      if (err.code === "RIDE_ALREADY_ENDED") {
        return res.status(409).json({
          status: "error",
          data: null,
          message: "이미 종료된 운행입니다.",
        });
      }

      return res.status(500).json({
        status: "error",
        data: null,
        message: "서버 오류가 발생했습니다.",
      });
    }
};