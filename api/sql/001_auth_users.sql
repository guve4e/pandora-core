-- Enable uuid generation (choose one; pgcrypto is simplest)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth_users (
                                          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    refresh_token_hash text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
    );

-- Optional: if you want case-insensitive usernames:
-- CREATE UNIQUE INDEX IF NOT EXISTS auth_users_username_ci_uq
--   ON auth_users (lower(username));