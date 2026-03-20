-- Clean up duplicate: delete the older resident record
DELETE FROM residents 
WHERE email = 'dale@gmail.com' 
AND id = '8d2eca57-503f-451c-930b-15ad454a3259';

-- Link existing approved resident to auth user
UPDATE residents 
SET user_id = '67e25e53-def8-4f76-b1a3-8fd99512ecbe'
WHERE id = '7634cb25-bb02-46b0-9085-f33e8cf013c3' 
AND user_id IS NULL;

-- Create a function to link resident to auth user on login (bypasses RLS)
CREATE OR REPLACE FUNCTION public.link_resident_to_user(p_user_id uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated boolean := false;
BEGIN
  UPDATE residents
  SET user_id = p_user_id
  WHERE email = p_email
    AND user_id IS NULL
    AND approval_status = 'approved'
    AND deleted_at IS NULL;
  
  IF FOUND THEN
    v_updated := true;
  END IF;
  
  RETURN v_updated;
END;
$$;