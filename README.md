# 🌐 safe-kick-server
Safe Kick - Node.js 앱 서버 (Express + PostgreSQL)

## 📁 폴더 구조

```
safe-kick-server/
│
├── src/
│   ├── routes/                 # API 라우터
│   │   ├── auth.js             # POST /auth/register, /auth/login, /auth/face-verify
│   │   ├── users.js            # GET /users/me
|   |   ├── session.js
|   |   ├── kickboard.js
│   │   └── rides.js            # GET/POST /rides, /rides/start, /rides/:id/end
│   │
│   ├── controllers/            # 라우터별 비즈니스 로직
│   │   ├── authController.js
│   │   ├── usersController.js
│   │   └── ridesController.js
│   │
│   ├── middlewares/            # 미들웨어
│   │   └── authMiddleware.js   # JWT 인증
│   │
│   └── config/                     # DB 연결 및 쿼리
│       └── db.js            # PostgreSQL 연결
│
├── Dockerfile
├── docker-compose.yml          # 앱 서버 + PostgreSQL + Nginx
├── nginx.conf
├── .env.example
├── package.json
└── README.md
```


## 실행 방법

```bash
cp .env.example .env
docker compose up --build
```

## 서버 확인

```bash
http://localhost:3000/health
http://localhost:3000/health/db
```

## 종료

```bash
docker compose down
```
## DB 데이터까지 삭제

```bash
docker compose down -v
```

## 팀원한테 공유할 때 명령어

```bash
git clone <깃허브주소>
cd safe-kick-server
cp .env.example .env
docker compose up --build
```

- .env는 gitignore에 등록되어 있기 때문에 깃허브에 안올라감
- 그래서 .env.example를 .env로 복사를 해야함
- 이렇게 한 번 복사한 뒤 .env 파일 수정은 깃허브 말고 외부 소통으로 수정

