-- ── Migration: add contact_numbers to profiles ────────────────────────────────
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- After running, regenerate TypeScript types:
--   npx supabase gen types typescript --project-id okoszqbrjuwwgtmjcfzt \
--     > src/types/database.ts
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Helper function — validates the contact_numbers array.
--    Must be IMMUTABLE so it can be used inside a CHECK constraint.
--    Postgres forbids subqueries directly in CHECK; they work inside functions.
CREATE OR REPLACE FUNCTION public.check_contact_numbers_primary(contact_numbers jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN contact_numbers IS NULL THEN true
    WHEN jsonb_typeof(contact_numbers) != 'array' THEN false
    WHEN jsonb_array_length(contact_numbers) NOT BETWEEN 1 AND 5 THEN false
    ELSE (
      SELECT COUNT(*) = 1
      FROM jsonb_array_elements(contact_numbers) AS entry
      WHERE (entry->>'is_primary')::boolean = true
    )
  END;
$$;

-- 2. Add the column (nullable — existing rows have no contacts yet)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_numbers jsonb;

-- 3. Attach the check constraint via the helper function
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_contact_numbers_one_primary
  CHECK (public.check_contact_numbers_primary(contact_numbers));

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- No new policy needed. The existing UPDATE policy (auth.uid() = id) covers
-- all columns including contact_numbers.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Storage: logos bucket RLS ─────────────────────────────────────────────────
-- Ensure in Dashboard → Storage → Policies:
--   INSERT: name LIKE (auth.uid()::text || '.%')
--   SELECT: true  (public read — tracking pages load logos unauthenticated)
-- ─────────────────────────────────────────────────────────────────────────────
