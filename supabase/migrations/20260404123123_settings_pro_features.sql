-- Migration: settings_pro_features
-- Adds production settings support for:
-- 1. profiles.is_pro gate
-- 2. pro_waitlist table for upgrade interest
-- Fully idempotent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.pro_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pro_waitlist_seller_id_key UNIQUE (seller_id)
);

CREATE INDEX IF NOT EXISTS idx_pro_waitlist_seller_id
  ON public.pro_waitlist (seller_id);

ALTER TABLE public.pro_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro_waitlist_select_own" ON public.pro_waitlist;
DROP POLICY IF EXISTS "pro_waitlist_insert_own" ON public.pro_waitlist;

CREATE POLICY "pro_waitlist_select_own" ON public.pro_waitlist
  FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "pro_waitlist_insert_own" ON public.pro_waitlist
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
