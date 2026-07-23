const kickboardsService =
  require("../services/kickboardsService");

/**
 * QR에서 읽은 공개 킥보드 ID를 확인한다.
 *
 * GET /kickboards/:publicId
 */
const getKickboard = async (req, res) => {
  try {
    const publicId = String(
      req.params.publicId ?? "",
    )
      .trim()
      .toUpperCase();

    /*
     * 테스트용 QR ID 형식:
     * KB- + 영문 대문자 또는 숫자 8자리
     *
     * 예:
     * KB-7F3A9C2D
     */
    const kickboardIdPattern =
      /^KB-[A-Z0-9]{8}$/;

    if (!kickboardIdPattern.test(publicId)) {
      return res.status(400).json({
        status: "error",
        data: null,
        message:
          "킥보드 ID 형식이 올바르지 않습니다.",
      });
    }

    const kickboard =
      await kickboardsService
        .getKickboardByPublicId(publicId);

    if (!kickboard) {
      return res.status(404).json({
        status: "error",
        data: null,
        message:
          "등록되지 않은 킥보드입니다.",
      });
    }

    const available =
      kickboard.status === "available";

    return res.status(200).json({
      status: "success",
      data: {
        kickboard_id:
          kickboard.public_id,
        status: kickboard.status,
        available,
      },
      message: available
        ? "사용 가능한 킥보드입니다."
        : "현재 사용할 수 없는 킥보드입니다.",
    });

  } catch (error) {
    console.error(
      "[KICKBOARD] 킥보드 조회 실패:",
      error,
    );

    return res.status(500).json({
      status: "error",
      data: null,
      message:
        "서버 오류가 발생했습니다.",
    });
  }
};

module.exports = {
  getKickboard,
};