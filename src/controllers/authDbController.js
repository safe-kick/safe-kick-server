const bcrypt = require("bcrypt");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      email,
      password,
      license_no,
      license_expires_at,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !license_no ||
      !license_expires_at 
    ) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "필수 필드가 누락되었습니다.",
      });
    }

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        data: null,
        message: "이미 가입된 이메일입니다.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const userResult = await client.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [name, email, passwordHash]
    );

    const userId = userResult.rows[0].id;

    await client.query(
      `
      INSERT INTO licenses (user_id, license_no, expires_at)
      VALUES ($1, $2, $3)
      `,
      [userId, license_no, license_expires_at]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      status: "success",
      data: {
        user_id: userId,
      },
      message: "회원가입이 완료되었습니다.",
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error(err);

    return res.status(500).json({
      status: "error",
      data: null,
      message: "서버 오류가 발생했습니다.",
    });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        data: null,
        message: "이메일과 비밀번호를 입력해주세요.",
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "error",
        data: null,
        message: "이메일 또는 비밀번호가 일치하지 않습니다.",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        data: null,
        message: "이메일 또는 비밀번호가 일치하지 않습니다.",
      });
    }

    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      status: "success",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      message: "로그인에 성공했습니다.",
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

exports.faceVerify = async (req, res) => {
  return res.status(501).json({
    status: "error",
    data: null,
    message: "아직 구현되지 않은 API입니다.",
  });
};