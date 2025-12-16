-- Subscriptions table for tracking client subscriptions
-- Used for charging clients monthly for access to the platform

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'cancelled', 'past_due')),
  payfast_payment_id text,
  amount_cents integer NOT NULL DEFAULT 0,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions (via webhook)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
