-- ── Migration: consolidate_customers ──────────────────────────────────────────
-- Drops the legacy address_book table and consolidates customer data into:
--   customers         — name, phone, notes, seller_id
--   customer_addresses — one-to-many addresses per customer; exactly one is_default
--
-- Also creates a security-invoker view customers_with_stats that joins orders
-- for server-side order_count and failed_count aggregation.
--
-- Fully idempotent — safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Step 1: Alter customers table ────────────────────────────────────────────

-- Rename user_id → seller_id (FK constraint name stays, column name updates)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.customers RENAME COLUMN user_id TO seller_id;
  END IF;
END;
$$;

-- Add notes column
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes text;

-- updated_at trigger using existing helper
DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Step 2: Create customer_addresses table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  seller_id   uuid        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  address     text        NOT NULL,
  city        text,
  label       text,                          -- e.g. "Home", "Work", "Shop"
  is_default  boolean     NOT NULL DEFAULT false,
  created_at  timestamptz          DEFAULT now()
);

-- Constraint: exactly one default per customer (enforced via trigger below)
-- Index: fast lookup of all addresses for a customer
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer
  ON public.customer_addresses (customer_id);

-- Index: fast lookup of default address
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default
  ON public.customer_addresses (customer_id, is_default);

-- Index: list query per seller
CREATE INDEX IF NOT EXISTS idx_customer_addresses_seller
  ON public.customer_addresses (seller_id);

-- ── Step 3: Trigger — enforce exactly-one default ────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a row is set as default, unset all others for the same customer
  IF NEW.is_default = true THEN
    UPDATE public.customer_addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id
      AND id <> NEW.id
      AND is_default = true;
  END IF;

  -- Prevent unsetting the only default (ensure at least one default remains)
  IF NEW.is_default = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.customer_addresses
      WHERE customer_id = NEW.customer_id
        AND id <> NEW.id
        AND is_default = true
    ) THEN
      RAISE EXCEPTION 'Customer must have at least one default address';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_default_address ON public.customer_addresses;
CREATE TRIGGER trg_single_default_address
  BEFORE INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_default_address();

-- ── Step 4: Row-Level Security on customers ───────────────────────────────────

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_select_own" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_own" ON public.customers;
DROP POLICY IF EXISTS "customers_update_own" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_own" ON public.customers;

CREATE POLICY "customers_select_own" ON public.customers
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "customers_insert_own" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "customers_update_own" ON public.customers
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "customers_delete_own" ON public.customers
  FOR DELETE USING (auth.uid() = seller_id);

-- ── Step 5: Row-Level Security on customer_addresses ─────────────────────────

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_addresses_select_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_insert_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_update_own" ON public.customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_delete_own" ON public.customer_addresses;

CREATE POLICY "customer_addresses_select_own" ON public.customer_addresses
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "customer_addresses_insert_own" ON public.customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "customer_addresses_update_own" ON public.customer_addresses
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "customer_addresses_delete_own" ON public.customer_addresses
  FOR DELETE USING (auth.uid() = seller_id);

-- ── Step 6: Migrate existing customers.address/city → customer_addresses ─────

INSERT INTO public.customer_addresses (customer_id, seller_id, address, city, is_default)
SELECT
  c.id,
  c.seller_id,
  c.address,
  c.city,
  true
FROM public.customers c
WHERE c.address IS NOT NULL
  AND c.address <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.customer_addresses ca WHERE ca.customer_id = c.id
  );

-- ── Step 7: Migrate address_book → customers + customer_addresses ─────────────
-- Reuse the address_book.id as the customer.id so existing orders.customer_id
-- FKs (which were populated with address_book IDs) become valid after migration.

DO $$
DECLARE
  rec record;
BEGIN
  -- Only run if address_book exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'address_book'
  ) THEN
    RAISE NOTICE 'address_book table not found — migration already applied';
    RETURN;
  END IF;

  FOR rec IN
    SELECT * FROM public.address_book
  LOOP
    -- Insert customer (keep same id — lets existing orders.customer_id link up)
    INSERT INTO public.customers (id, seller_id, name, phone, notes, created_at)
    VALUES (
      rec.id,
      rec.seller_id,
      rec.customer_name,
      rec.customer_phone,
      null,
      COALESCE(rec.created_at::timestamptz, now())
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert address (only if the customer doesn't have one yet)
    IF NOT EXISTS (
      SELECT 1 FROM public.customer_addresses WHERE customer_id = rec.id
    ) THEN
      INSERT INTO public.customer_addresses (customer_id, seller_id, address, city, label, is_default)
      VALUES (rec.id, rec.seller_id, rec.address, rec.city, rec.label, true);
    END IF;
  END LOOP;

  RAISE NOTICE 'Migrated % rows from address_book', (SELECT COUNT(*) FROM public.address_book);
END;
$$;

-- ── Step 8: Drop migrated columns from customers ──────────────────────────────

ALTER TABLE public.customers DROP COLUMN IF EXISTS address;
ALTER TABLE public.customers DROP COLUMN IF EXISTS city;

-- ── Step 9: Back-fill orders.customer_id from order customer_name + phone ────
-- Best-effort: link historical orders to newly-created customers where possible

UPDATE public.orders o
SET customer_id = c.id
FROM public.customers c
WHERE c.seller_id = o.seller_id
  AND c.name = o.customer_name
  AND c.phone = o.customer_phone
  AND o.customer_id IS NULL
  AND o.customer_name IS NOT NULL;

-- ── Step 10: Drop address_book ────────────────────────────────────────────────

DROP TABLE IF EXISTS public.address_book;

-- ── Step 11: customers_with_stats view (server-side order/failed counts) ─────
-- security_invoker = true → runs as calling user, inherits RLS on base tables.

DROP VIEW IF EXISTS public.customers_with_stats;

CREATE VIEW public.customers_with_stats
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.seller_id,
  c.name,
  c.phone,
  c.notes,
  c.created_at,
  c.updated_at,
  -- Denormalised default address for list/order-creation use
  ca.address  AS address,
  ca.city     AS city,
  -- Server-side aggregation — no client-side counting
  COALESCE(COUNT(DISTINCT o.id),                                              0)::int AS order_count,
  COALESCE(COUNT(DISTINCT CASE WHEN o.status = 'failed' THEN o.id END), 0)::int AS failed_count
FROM   public.customers c
LEFT  JOIN public.customer_addresses ca ON ca.customer_id = c.id AND ca.is_default = true
LEFT  JOIN public.orders o              ON o.customer_id  = c.id
GROUP  BY c.id, c.seller_id, c.name, c.phone, c.notes, c.created_at, c.updated_at, ca.address, ca.city;

-- ── Step 12: Index for fast name-ordered seller list ─────────────────────────

CREATE INDEX IF NOT EXISTS idx_customers_seller_name
  ON public.customers (seller_id, name);
