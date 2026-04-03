-- ── Migration: harden_riders ──────────────────────────────────────────────────
-- Covers all three manual-action items from the riders production audit:
--   1. RLS policies on the riders table
--   2. total_deliveries maintenance trigger (orders status → delivered)
--   3. orders.rider_id FK — SET NULL on rider delete (preserves order history)
-- Fully idempotent — safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 1. Row-Level Security on riders ─────────────────────────────────────────

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so the migration is idempotent
DROP POLICY IF EXISTS "riders_select_own"  ON public.riders;
DROP POLICY IF EXISTS "riders_insert_own"  ON public.riders;
DROP POLICY IF EXISTS "riders_update_own"  ON public.riders;
DROP POLICY IF EXISTS "riders_delete_own"  ON public.riders;

-- Sellers can only see their own riders
CREATE POLICY "riders_select_own" ON public.riders
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can only insert riders they own
CREATE POLICY "riders_insert_own" ON public.riders
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can only update their own riders
CREATE POLICY "riders_update_own" ON public.riders
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can only delete their own riders
CREATE POLICY "riders_delete_own" ON public.riders
  FOR DELETE
  USING (auth.uid() = seller_id);

-- ── 2. Index: fast list query (seller_id + name ASC) ────────────────────────

CREATE INDEX IF NOT EXISTS idx_riders_seller_name
  ON public.riders (seller_id, name);

-- ── 3. total_deliveries maintenance trigger ──────────────────────────────────
-- Fires AFTER INSERT OR UPDATE OF status on orders.
-- Increments rider.total_deliveries when status → 'delivered'.
-- Decrements (floor 0) when status reverts FROM 'delivered' (correction).

CREATE OR REPLACE FUNCTION public.sync_rider_total_deliveries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: order created with status already delivered (edge case)
  IF TG_OP = 'INSERT'
    AND NEW.status = 'delivered'
    AND NEW.rider_id IS NOT NULL
  THEN
    UPDATE public.riders
      SET total_deliveries = total_deliveries + 1
    WHERE id = NEW.rider_id;
    RETURN NEW;
  END IF;

  -- UPDATE: status just flipped TO 'delivered'
  IF TG_OP = 'UPDATE'
    AND NEW.status = 'delivered'
    AND (OLD.status IS DISTINCT FROM 'delivered')
    AND NEW.rider_id IS NOT NULL
  THEN
    UPDATE public.riders
      SET total_deliveries = total_deliveries + 1
    WHERE id = NEW.rider_id;
  END IF;

  -- UPDATE: status reverted FROM 'delivered' (correction / re-open)
  IF TG_OP = 'UPDATE'
    AND OLD.status = 'delivered'
    AND (NEW.status IS DISTINCT FROM 'delivered')
    AND OLD.rider_id IS NOT NULL
  THEN
    UPDATE public.riders
      SET total_deliveries = GREATEST(0, total_deliveries - 1)
    WHERE id = OLD.rider_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Replace trigger if it already exists
DROP TRIGGER IF EXISTS trg_sync_rider_deliveries ON public.orders;

CREATE TRIGGER trg_sync_rider_deliveries
  AFTER INSERT OR UPDATE OF status
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_rider_total_deliveries();

-- ── 4. orders.rider_id FK — ensure SET NULL on rider delete ─────────────────
-- Deleting a rider must not cascade-delete their orders (history stays).
-- If the current rule is CASCADE, drop and recreate as SET NULL.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   information_schema.referential_constraints rc
    JOIN   information_schema.key_column_usage kcu
           ON  rc.constraint_name = kcu.constraint_name
           AND kcu.constraint_schema = rc.constraint_schema
    WHERE  kcu.table_schema  = 'public'
      AND  kcu.table_name    = 'orders'
      AND  kcu.column_name   = 'rider_id'
      AND  rc.delete_rule    = 'CASCADE'
  ) THEN
    ALTER TABLE public.orders
      DROP CONSTRAINT orders_rider_id_fkey;

    ALTER TABLE public.orders
      ADD CONSTRAINT orders_rider_id_fkey
        FOREIGN KEY (rider_id)
        REFERENCES public.riders (id)
        ON DELETE SET NULL;

    RAISE NOTICE 'orders_rider_id_fkey updated from CASCADE → SET NULL';
  ELSE
    RAISE NOTICE 'orders_rider_id_fkey delete rule is already safe (not CASCADE) — no change needed';
  END IF;
END;
$$;
