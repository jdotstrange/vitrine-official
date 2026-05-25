-- Push notification token lifecycle management.
-- Stores native APNs/FCM tokens per user for registration tracking
-- and cleanup. Stream handles actual push delivery.

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON user_push_tokens FOR ALL
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON user_push_tokens TO authenticated;
