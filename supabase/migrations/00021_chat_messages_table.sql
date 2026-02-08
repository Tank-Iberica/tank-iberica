-- ================================================
-- Migration 00021: Chat Messages Table
-- Admin-user messaging system with Realtime support
-- ================================================

-- Create the updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create message direction enum
CREATE TYPE msg_direction AS ENUM ('user_to_admin', 'admin_to_user');

-- ================================================
-- Chat Messages Table
-- ================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (the user in the conversation)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,

  -- Direction: who sent the message
  direction msg_direction NOT NULL,

  -- Read status (admin reads user messages, user reads admin messages)
  is_read BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- Indexes
-- ================================================

-- Fast lookup by user (for conversation list)
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

-- Fast lookup for unread messages
CREATE INDEX idx_chat_messages_unread ON chat_messages(user_id, is_read) WHERE is_read = FALSE;

-- Chronological order within conversation
CREATE INDEX idx_chat_messages_created_at ON chat_messages(user_id, created_at DESC);

-- ================================================
-- RLS Policies
-- ================================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Admin can see all messages
CREATE POLICY "admin_select_chat_messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Admin can insert messages (as admin_to_user)
CREATE POLICY "admin_insert_chat_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    AND direction = 'admin_to_user'
  );

-- Admin can update messages (mark as read, etc.)
CREATE POLICY "admin_update_chat_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Users can see their own messages
CREATE POLICY "user_select_own_chat_messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Users can insert messages (as user_to_admin)
CREATE POLICY "user_insert_chat_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND direction = 'user_to_admin'
  );

-- Users can mark admin messages as read
CREATE POLICY "user_update_read_status"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND direction = 'admin_to_user'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND direction = 'admin_to_user'
  );

-- ================================================
-- Enable Realtime
-- ================================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ================================================
-- Updated_at trigger
-- ================================================
CREATE TRIGGER set_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
