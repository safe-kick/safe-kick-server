-- ===========================
-- users
-- ===========================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- licenses
-- ===========================
CREATE TABLE IF NOT EXISTS licenses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_no VARCHAR(20) NOT NULL,
    expires_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 얼굴 원본이 아닌 InsightFace 임베딩을 AES-256-GCM으로 암호화해 저장한다.
CREATE TABLE IF NOT EXISTS face_embeddings (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    encrypted_embedding BYTEA NOT NULL,
    encryption_iv BYTEA NOT NULL,
    auth_tag BYTEA NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    dimension INTEGER NOT NULL CHECK (dimension > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ===========================
-- kickboards
-- ===========================
CREATE TABLE IF NOT EXISTS kickboards (
    id BIGSERIAL PRIMARY KEY,

    public_id VARCHAR(50)
        UNIQUE
        NOT NULL,

    device_id VARCHAR(50)
        UNIQUE
        NOT NULL,

    status VARCHAR(20)
        NOT NULL
        DEFAULT 'available',

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT kickboards_status_check
        CHECK (
            status IN (
                'available',
                'in_use',
                'maintenance',
                'offline'
            )
        )
);

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

-- ===========================
-- rides
-- ===========================
CREATE TABLE IF NOT EXISTS rides (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kickboard_id VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    warning_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
