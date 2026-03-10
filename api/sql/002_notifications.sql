CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NULL,

  type VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',

  entity_type VARCHAR(80) NULL,
  entity_id VARCHAR(120) NULL,
  link VARCHAR(500) NULL,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ NULL,

  meta JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created
  ON notifications (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (tenant_id, user_id, is_read, created_at DESC);
