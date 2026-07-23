-- ===========================
-- users
-- ===========================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
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