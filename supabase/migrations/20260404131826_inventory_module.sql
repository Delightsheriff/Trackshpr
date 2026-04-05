-- Inventory module
-- Creates products, stock movements, order items, storage bucket, and stock RPCs.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12, 0) NOT NULL CHECK (price >= 0),
  photo_url text,
  sku text,
  unit text NOT NULL DEFAULT 'piece'
    CHECK (unit IN ('piece', 'dozen', 'carton', 'bale', 'kg', 'litre', 'pack', 'set')),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('restock', 'sale', 'adjustment', 'damage')),
  quantity integer NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12, 0) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_seller_name
  ON public.products (seller_id, name)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_low_stock
  ON public.products (seller_id, quantity, low_stock_threshold)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created
  ON public.stock_movements (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON public.order_items (product_id);

DROP VIEW IF EXISTS public.low_stock_products;
CREATE VIEW public.low_stock_products
WITH (security_invoker = true) AS
SELECT *
FROM public.products
WHERE is_active = true
  AND quantity <= low_stock_threshold;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner manages products" ON public.products;
CREATE POLICY "owner manages products"
  ON public.products FOR ALL
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "owner manages stock movements" ON public.stock_movements;
CREATE POLICY "owner manages stock movements"
  ON public.stock_movements FOR ALL
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "owner manages order items" ON public.order_items;
CREATE POLICY "owner manages order items"
  ON public.order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.seller_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.create_product_with_initial_stock(
  p_seller_id uuid,
  p_name text,
  p_price numeric,
  p_unit text DEFAULT 'piece',
  p_quantity integer DEFAULT 0,
  p_low_stock_threshold integer DEFAULT 5,
  p_description text DEFAULT NULL,
  p_sku text DEFAULT NULL,
  p_photo_url text DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_product public.products;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_seller_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.products (
    seller_id,
    name,
    description,
    price,
    photo_url,
    sku,
    unit,
    quantity,
    low_stock_threshold
  )
  VALUES (
    p_seller_id,
    p_name,
    p_description,
    p_price,
    p_photo_url,
    p_sku,
    p_unit,
    GREATEST(COALESCE(p_quantity, 0), 0),
    GREATEST(COALESCE(p_low_stock_threshold, 5), 0)
  )
  RETURNING * INTO new_product;

  IF COALESCE(p_quantity, 0) > 0 THEN
    INSERT INTO public.stock_movements (product_id, seller_id, type, quantity, note)
    VALUES (new_product.id, p_seller_id, 'restock', p_quantity, 'Initial stock');
  END IF;

  RETURN new_product;
END;
$$;

CREATE OR REPLACE FUNCTION public.restock_product_stock(
  p_product_id uuid,
  p_quantity integer,
  p_note text DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_product public.products;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Restock quantity must be greater than zero';
  END IF;

  SELECT *
  INTO current_product
  FROM public.products
  WHERE id = p_product_id
    AND seller_id = auth.uid()
    AND is_active = true
  FOR UPDATE;

  IF current_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  UPDATE public.products
  SET quantity = quantity + p_quantity
  WHERE id = p_product_id
  RETURNING * INTO current_product;

  INSERT INTO public.stock_movements (product_id, seller_id, type, quantity, note)
  VALUES (p_product_id, current_product.seller_id, 'restock', p_quantity, NULLIF(trim(COALESCE(p_note, '')), ''));

  RETURN current_product;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id uuid,
  p_quantity integer,
  p_type text,
  p_note text DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_product public.products;
  movement_quantity integer;
  next_quantity integer;
BEGIN
  IF p_type NOT IN ('adjustment', 'damage') THEN
    RAISE EXCEPTION 'Adjustment type must be adjustment or damage';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  SELECT *
  INTO current_product
  FROM public.products
  WHERE id = p_product_id
    AND seller_id = auth.uid()
    AND is_active = true
  FOR UPDATE;

  IF current_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  movement_quantity := CASE
    WHEN p_type = 'damage' THEN -1 * p_quantity
    ELSE p_quantity
  END;
  next_quantity := current_product.quantity + movement_quantity;

  IF next_quantity < 0 THEN
    RAISE EXCEPTION 'Stock cannot go below zero';
  END IF;

  UPDATE public.products
  SET quantity = next_quantity
  WHERE id = p_product_id
  RETURNING * INTO current_product;

  INSERT INTO public.stock_movements (product_id, seller_id, type, quantity, note)
  VALUES (
    p_product_id,
    current_product.seller_id,
    p_type,
    movement_quantity,
    NULLIF(trim(COALESCE(p_note, '')), '')
  );

  RETURN current_product;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "products bucket public read" ON storage.objects;
CREATE POLICY "products bucket public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "products bucket owner insert" ON storage.objects;
CREATE POLICY "products bucket owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "products bucket owner update" ON storage.objects;
CREATE POLICY "products bucket owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'products'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'products'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "products bucket owner delete" ON storage.objects;
CREATE POLICY "products bucket owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
