-- Blocked users table for user-to-user blocking
CREATE TABLE public.blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own blocks"
  ON public.blocked_users FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock"
  ON public.blocked_users FOR DELETE
  USING (blocker_id = auth.uid());
