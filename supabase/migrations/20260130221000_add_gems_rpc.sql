-- RPC to safely add gems
CREATE OR REPLACE FUNCTION add_gems(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET gems = COALESCE(gems, 0) + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
