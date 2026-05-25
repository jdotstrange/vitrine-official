-- Batch upload history for the web bulk uploader.
-- Each row represents one "Process Batch" invocation.
-- The `items` JSONB array stores per-card results and retry metadata.

CREATE TABLE IF NOT EXISTS batch_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- processing | completed | partial (some failed)
  status TEXT NOT NULL DEFAULT 'processing',

  total_items INT NOT NULL,
  successful_items INT NOT NULL DEFAULT 0,
  failed_items INT NOT NULL DEFAULT 0,

  -- Snapshot of batch-level defaults used for this run
  defaults JSONB,

  -- Per-item results array. Each element:
  -- {
  --   cardIndex: number,
  --   collectibleId: string | null,
  --   status: "done" | "failed",
  --   title: string,
  --   thumbnailUrl: string,
  --   photoUrls: string[],
  --   metadata: { status, value, visibility, showcaseIds, tags },
  --   error: string | null,
  --   retryCount: number
  -- }
  items JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup: user's batches in reverse chronological order
CREATE INDEX idx_batch_uploads_user_started
  ON batch_uploads (user_id, started_at DESC);

-- RLS
ALTER TABLE batch_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batch uploads"
  ON batch_uploads FOR SELECT
  USING (user_id = (
    SELECT id FROM users WHERE supabase_auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert own batch uploads"
  ON batch_uploads FOR INSERT
  WITH CHECK (user_id = (
    SELECT id FROM users WHERE supabase_auth_id = auth.uid()
  ));

CREATE POLICY "Users can update own batch uploads"
  ON batch_uploads FOR UPDATE
  USING (user_id = (
    SELECT id FROM users WHERE supabase_auth_id = auth.uid()
  ));

-- Grants. PostgREST requires both table-level privileges AND RLS-pass
-- for any operation. Without this clause the table is unreachable from
-- the browser even with permissive RLS.
GRANT SELECT, INSERT, UPDATE ON batch_uploads TO authenticated;
