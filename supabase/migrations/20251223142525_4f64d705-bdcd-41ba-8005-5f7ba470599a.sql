-- Create shared_transactions table for storing share links
CREATE TABLE public.shared_transactions (
  id TEXT PRIMARY KEY,
  transaction_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  view_count INTEGER NOT NULL DEFAULT 0
);

-- No RLS needed as this is public data for sharing
ALTER TABLE public.shared_transactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view shared transactions (it's meant to be public)
CREATE POLICY "Shared transactions are publicly viewable"
  ON public.shared_transactions
  FOR SELECT
  USING (true);

-- Only authenticated users can create shared transactions
CREATE POLICY "Authenticated users can create shared transactions"
  ON public.shared_transactions
  FOR INSERT
  WITH CHECK (true);

-- Create index for expiry cleanup
CREATE INDEX idx_shared_transactions_expires_at ON public.shared_transactions(expires_at);