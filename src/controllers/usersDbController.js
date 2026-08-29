const usersService = require("../services/usersService");

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await usersService.getMe(userId);

    if (!user) {
      return res.status(404).json({
        status: "error",
        data: null,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        license: {
          license_no: user.license_no,
          expires_at: user.expires_at,
        },
        created_at: user.created_at,
      },
      message: "내 정보 조회에 성공했습니다.",
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
