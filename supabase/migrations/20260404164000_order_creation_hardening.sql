-- Harden order creation defaults and delivery-driven stock adjustments.

DO $$
DECLARE
  next_order_number bigint;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'order_number'
  ) THEN
    IF to_regclass('public.orders_order_number_seq') IS NULL THEN
      CREATE SEQUENCE public.orders_order_number_seq;
    END IF;

    SELECT COALESCE(MAX(order_number), 0) + 1
    INTO next_order_number
    FROM public.orders;

    PERFORM setval(
      'public.orders_order_number_seq',
      GREATEST(next_order_number, 1),
      false
    );

    ALTER TABLE public.orders
      ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq'::regclass);

    ALTER SEQUENCE public.orders_order_number_seq
      OWNED BY public.orders.order_number;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'rider_token'
  ) THEN
    ALTER TABLE public.orders
      ALTER COLUMN rider_token SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'customer_token'
  ) THEN
    ALTER TABLE public.orders
      ALTER COLUMN customer_token SET DEFAULT gen_random_uuid();
  END IF;
END
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
  normalized_quantity integer;
  movement_quantity integer;
  next_quantity integer;
BEGIN
  IF p_type NOT IN ('adjustment', 'damage', 'sale') THEN
    RAISE EXCEPTION 'Adjustment type must be adjustment, damage, or sale';
  END IF;

  IF p_quantity IS NULL OR p_quantity = 0 THEN
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

  normalized_quantity := ABS(p_quantity);
  movement_quantity := CASE
    WHEN p_type IN ('damage', 'sale') THEN -1 * normalized_quantity
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

CREATE OR REPLACE FUNCTION public.apply_delivered_order_stock(
  p_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_order public.orders;
  order_item_row public.order_items;
  movement_note text;
BEGIN
  SELECT *
  INTO current_order
  FROM public.orders
  WHERE id = p_order_id;

  IF current_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', current_order.seller_id::text, true);

  FOR order_item_row IN
    SELECT *
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    movement_note := 'order_item:' || order_item_row.id::text;

    IF NOT EXISTS (
      SELECT 1
      FROM public.stock_movements
      WHERE product_id = order_item_row.product_id
        AND type = 'sale'
        AND note = movement_note
    ) THEN
      PERFORM public.adjust_product_stock(
        order_item_row.product_id,
        -1 * ABS(order_item_row.quantity),
        'sale',
        movement_note
      );
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_delivered_order_stock(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.apply_delivered_order_stock(uuid) TO authenticated;
