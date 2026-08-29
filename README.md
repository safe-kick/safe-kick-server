# 🌐 safe-kick-server

Safe Kick 서비스의 **Node.js 앱 서버**입니다.

Express와 PostgreSQL을 사용하며 다음 기능을 담당합니다.

- 회원가입 및 로그인
- JWT 인증
- 사용자 정보 조회
- QR 킥보드 조회 및 사용 가능 상태 확인
- 운행 시작·종료
- 진행 중인 운행 조회
- 최근 운행 및 운행 상세 조회
- 앱이 Raspberry Pi 안전 세션과 함께 사용할 운행 메타데이터 관리

실제 센서 검사와 잠금 제어는 앱이 `safe-kick-raspi` API를 직접 호출해 수행합니다.
이 저장소의 `/session/*`, `/status`, `/lock`, `/unlock`은 기존 클라이언트 호환용
고정 Mock 응답이며 실제 Raspberry Pi나 STM32를 제어하지 않습니다.

---

## 🛠 기술 스택

```text
Node.js
Express
PostgreSQL
JWT
Docker
Docker Compose
Nginx
```

---

## 📁 폴더 구조

```text
safe-kick-server/
│
├── src/
│   ├── app.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── rides.js
│   │   ├── session.js
│   │   ├── kickboard.js
│   │   ├── kickboards.js
│   │   └── users.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── authDbController.js
│   │   ├── authMockController.js
│   │   ├── usersController.js
│   │   ├── usersDbController.js
│   │   ├── usersMockController.js
│   │   ├── ridesController.js
│   │   ├── ridesDbController.js
│   │   ├── ridesMockController.js
│   │   └── kickboardsController.js
│   │
│   ├── services/
│   │   ├── ridesService.js
│   │   ├── kickboardsService.js
│   │   └── usersService.js
│   │
│   ├── middlewares/
│   │   └── authMiddleware.js
│   │
│   └── config/
│       └── db.js
│
├── init/
│   └── init.sql
│
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ 환경변수

`.env.example`을 복사하여 `.env`를 만듭니다.

```bash
cp .env.example .env
```

예시:

```env
PORT=3000

DB_HOST=db
DB_PORT=5432
DB_NAME=cutdb
DB_USER=user
DB_PASSWORD=1234

ALLOW_CONCURRENT_RIDES=false

JWT_SECRET=safe-kick-dev-secret
```

주의사항:

- `.env`는 GitHub에 올리지 않습니다.
- `.env.example`에는 실제 비밀번호나 운영용 JWT Secret을 넣지 않습니다.
- `USE_MOCK`은 선택값이며 미설정 또는 `false`이면 PostgreSQL 컨트롤러,
  `true`이면 사용자·인증·운행 Mock 컨트롤러를 사용합니다.
- `ALLOW_CONCURRENT_RIDES=false`이면 한 사용자의 중복 운행과 사용 중인 킥보드의
  재대여를 차단합니다.
- 현재 `docker-compose.yml`은 통합 테스트를 위해
  `ALLOW_CONCURRENT_RIDES=true`를 강제로 덮어씁니다. 운영 또는 최종 시연 환경에서는
  이 override를 제거하거나 `false`로 바꿔야 정상적인 중복 운행 방지가 적용됩니다.

---

## ▶️ 실행 방법

```bash
docker compose up --build
```

백그라운드 실행:

```bash
docker compose up -d --build
```

앱 컨테이너만 다시 빌드:

```bash
docker compose up -d --build app
```

---

## ✅ 서버 확인

```text
http://localhost:3000/health
http://localhost:3000/health/db
```

Nginx를 사용하는 경우:

```text
http://localhost/health
http://localhost/health/db
```

---

## 🛑 종료

```bash
docker compose down
```

DB 볼륨까지 삭제:

```bash
docker compose down -v
```

`docker compose down -v`를 실행하면 PostgreSQL 데이터가 모두 삭제됩니다.

---

# 🗄 데이터베이스

## users

사용자 계정 정보를 저장합니다.

```sql
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## licenses

사용자의 면허증 정보를 저장합니다. 원본 면허증 이미지는 Node.js DB에 저장하지 않습니다.

```sql
CREATE TABLE IF NOT EXISTS licenses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_no VARCHAR(20) NOT NULL,
    expires_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## kickboards

QR로 식별되는 킥보드 정보를 저장합니다.

```sql
CREATE TABLE IF NOT EXISTS kickboards (
    id BIGSERIAL PRIMARY KEY,
    public_id VARCHAR(50) UNIQUE NOT NULL,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT kickboards_status_check
        CHECK (status IN ('available', 'in_use', 'maintenance', 'offline'))
);
```

테스트용 킥보드:

```sql
INSERT INTO kickboards (
    public_id,
    device_id,
    status
)
VALUES (
    'KB-7F3A9C2D',
    'RPI-001',
    'available'
)
ON CONFLICT (public_id) DO NOTHING;
```

상태:

```text
available
→ 대여 가능

in_use
→ 운행 중

maintenance
→ 점검 중

offline
→ 연결 불가
```

## rides

사용자의 운행 기록을 저장합니다.

```sql
CREATE TABLE IF NOT EXISTS rides (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kickboard_id VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    warning_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

현재는 `rides.kickboard_id`와 `kickboards.public_id` 사이에 외래키를 적용하지 않았습니다.

---

# 🔐 JWT 인증

다음 API는 JWT 인증이 필요합니다.

```text
GET   /users/...
GET   /rides
POST  /rides/start
GET   /rides/recent
GET   /rides/active
GET   /rides/:rideId
PATCH /rides/:rideId/end
GET   /kickboards/:publicId
```

요청 헤더:

```http
Authorization: Bearer 실제_JWT
```

로그인 성공 응답의 `data.token`을 사용합니다.

```json
{
  "status": "success",
  "data": {
    "token": "eyJ..."
  }
}
```

다음 값은 실제 JWT가 아닙니다.

```text
mock.jwt.token
```

---

# 📡 API

`/auth`, `/users`, `/rides`, `/kickboards`는 실제 서비스 API입니다. 반면
`/session/*`, `/status`, `/lock`, `/unlock`은 인증·DB·하드웨어 제어 없이 고정된
Mock 데이터를 반환하는 호환 경로입니다.

## 1. 회원가입

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password1234",
  "license_no": "12-34-567890-12",
  "license_expires_at": "2030-01-01"
}
```

회원가입 요청은 프론트에서 Raspberry Pi 얼굴 검출 성공 후 호출합니다.

```text
POST Raspberry Pi /face/detect
→ 얼굴 검출 성공
→ POST Node.js /auth/register
→ user_id 발급
→ POST Raspberry Pi /face/register
→ 얼굴 임베딩 저장
→ POST Node.js /auth/login
```

## 2. 로그인

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password1234"
}
```

## 3. QR 킥보드 조회

```http
GET /kickboards/:publicId
Authorization: Bearer 실제_JWT
```

예시:

```http
GET /kickboards/KB-7F3A9C2D
```

사용 가능한 경우:

```json
{
  "status": "success",
  "data": {
    "kickboard_id": "KB-7F3A9C2D",
    "status": "available",
    "available": true
  },
  "message": "사용 가능한 킥보드입니다."
}
```

사용 중인 경우:

```json
{
  "status": "success",
  "data": {
    "kickboard_id": "KB-7F3A9C2D",
    "status": "in_use",
    "available": false
  },
  "message": "현재 사용할 수 없는 킥보드입니다."
}
```

등록되지 않은 경우:

```json
{
  "status": "error",
  "data": null,
  "message": "등록되지 않은 킥보드입니다."
}
```

## 4. 운행 시작

```http
POST /rides/start
Authorization: Bearer 실제_JWT
Content-Type: application/json
```

```json
{
  "kickboard_id": "KB-7F3A9C2D"
}
```

서버 처리:

```text
진행 중인 사용자 운행 확인
→ kickboard_id 조회
→ available 상태 확인
→ rides 행 생성
→ kickboards.status = in_use
```

오류:

```text
404 → 등록되지 않은 킥보드입니다.
409 → 현재 사용할 수 없는 킥보드입니다.
409 → 이미 진행 중인 운행이 있습니다.
```

## 5. 진행 중인 운행 조회

```http
GET /rides/active
Authorization: Bearer 실제_JWT
```

진행 중인 운행이 있는 경우:

```json
{
  "status": "success",
  "data": {
    "ride_id": 1,
    "kickboard_id": "KB-7F3A9C2D",
    "started_at": "2026-07-23T08:30:00.000Z",
    "ended_at": null,
    "warning_count": 0
  },
  "message": "진행 중인 운행 조회에 성공했습니다."
}
```

진행 중인 운행이 없는 경우:

```json
{
  "status": "success",
  "data": null,
  "message": "진행 중인 운행이 없습니다."
}
```

## 6. 전체 운행 기록 조회

```http
GET /rides
Authorization: Bearer 실제_JWT
```

## 7. 최근 운행 기록 조회

```http
GET /rides/recent
Authorization: Bearer 실제_JWT
```

최근 5개의 운행 기록을 반환합니다.

## 8. 운행 상세 조회

```http
GET /rides/:rideId
Authorization: Bearer 실제_JWT
```

## 9. 운행 종료

```http
PATCH /rides/:rideId/end
Authorization: Bearer 실제_JWT
Content-Type: application/json
```

```json
{
  "warning_count": 0
}
```

서버 처리:

```text
rides.ended_at 저장
→ warning_count 저장
→ kickboards.status = available
```

이미 종료된 운행은 `409`를 반환합니다.

---

# 📱 테스트용 QR 코드

QR 코드에는 다음 문자열 전체를 넣습니다.

```text
safekickapp://ride?v=1&kickboard_id=KB-7F3A9C2D
```

QR에 포함되는 핵심 정보:

```text
v=1
→ QR 형식 버전

kickboard_id=KB-7F3A9C2D
→ kickboards.public_id
```

QR에 포함하지 않는 정보:

```text
JWT
user_id
ride_id
session_id
라즈베리파이 IP
Node.js 서버 IP
잠금 해제 비밀번호
```

QR은 킥보드를 식별하는 역할만 하며, 실제 대여 가능 여부와 운행 시작 권한은 서버가 판단합니다.

---

# 🔄 전체 운행 흐름

```text
사용자 로그인
→ QR 스캔
→ GET /kickboards/:publicId
→ 킥보드 존재 및 상태 확인
→ Raspberry Pi POST /session/start
→ 실시간 얼굴·헬멧 인증
→ MQ-3 baseline·음주·호흡 검사
→ 1인 탑승 무게 검사
→ Raspberry Pi가 STM32 잠금 해제 및 모니터링 시작
→ Node.js POST /rides/start
→ kickboards.status = in_use
→ 운행
→ Raspberry Pi 세션 종료
→ STM32 잠금 및 센서 스트림 종료
→ PATCH /rides/:rideId/end
→ kickboards.status = available
```

얼굴 임베딩은 운행 종료 때 삭제하지 않습니다. 사용자별 재인증을 위해 Raspberry
Pi에 유지하며, 계정 삭제 흐름에서 정리하는 데이터입니다.

---

# 🧪 Postman 테스트 순서

```text
1. POST /auth/login
2. GET /kickboards/KB-7F3A9C2D
3. POST /rides/start
4. GET /rides/active
5. PATCH /rides/:rideId/end
6. GET /rides/active
```

보호된 API에는 다음 헤더를 사용합니다.

```http
Authorization: Bearer 실제_JWT
```

---

# 🗃 DB 직접 확인

PostgreSQL 접속:

```bash
docker compose exec db psql -U user -d cutdb
```

킥보드 상태:

```sql
SELECT id, public_id, status
FROM kickboards;
```

운행 기록:

```sql
SELECT
    id,
    user_id,
    kickboard_id,
    started_at,
    ended_at,
    warning_count
FROM rides
ORDER BY id DESC;
```

종료:

```sql
\q
```

---

# 👥 팀원 실행 방법

```bash
git clone <GitHub 저장소 주소>
cd safe-kick-server
cp .env.example .env
docker compose up --build
```

주의사항:

- `.env`는 `.gitignore`에 등록되어 GitHub에 올라가지 않습니다.
- `.env.example`을 `.env`로 복사해야 합니다.
- 실제 DB 비밀번호와 JWT Secret은 별도로 공유합니다.
- 기존 DB 볼륨이 있으면 수정된 `init.sql`이 자동 재실행되지 않습니다.
- 기존 DB에 새 테이블이 필요하면 SQL을 직접 실행하거나 개발 환경에서 볼륨을 재생성해야 합니다.

---

# 📝 최종 구현 상태

- [x] 회원가입
- [x] 로그인
- [x] JWT 인증
- [x] PostgreSQL 연결
- [x] QR 킥보드 조회
- [x] 킥보드 `available / in_use` 상태 관리
- [x] 운행 시작
- [x] 운행 종료
- [x] 진행 중 운행 조회
- [x] 전체·최근·상세 운행 조회
- [x] 앱에서 Raspberry Pi 안전 세션과 Node.js 운행 기록 순차 연동

운영 배포 시에는 개발용 비밀번호와 JWT Secret 교체, Docker Compose의 동시 운행
허용 override 제거, 계정 삭제 시 Raspberry Pi 임베딩 정리 API 연동을 별도로
적용해야 합니다. 운행 종료 요청 재시도와 운영 비밀 관리도 배포 환경에서 선택적으로
보강할 수 있습니다.
