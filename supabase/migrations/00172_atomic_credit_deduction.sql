-- Migration 00172: Atomic credit deduction RPC
-- Fixes race condition #376 — SELECT FOR UPDATE prevents double-spending
--
-- Usage: SELECT * FROM deduct_credits('user-uuid', 3, 'unlock vehicle', 'vehicle-uuid');

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id     uuid,
  p_amount      integer,
  p_description text DEFAULT '',
  p_vehicle_id  uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, new_balance integer, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance   integer;
  v_new       integer;
BEGIN
  -- Lock the row to prevent concurrent deductions
  SELECT balance INTO v_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- No credit record found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'insufficient'::text;
    RETURN;
  END IF;

  -- Insufficient balance
  IF v_balance < p_amount THEN
    RETURN QUERY SELECT false, v_balance, 'insufficient'::text;
    RETURN;
  END IF;

  v_new := v_balance - p_amount;

  -- Atomic update
  UPDATE user_credits
  SET balance = v_new, updated_at = now()
  WHERE user_id = p_user_id;

  -- Record the transaction
  INSERT INTO credit_transactions (user_id, type, credits, balance_after, vehicle_id, description, metadata)
  VALUES (
    p_user_id,
    'spend',
    -p_amount,
    v_new,
    p_vehicle_id,
    p_description,
    jsonb_build_object('vertical', current_setting('app.vertical', true))
  );

  RETURN QUERY SELECT true, v_new, NULL::text;
END;
$$;

-- Grant execute to service_role (used by server-side crons and API routes)
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text, uuid) TO service_role;
