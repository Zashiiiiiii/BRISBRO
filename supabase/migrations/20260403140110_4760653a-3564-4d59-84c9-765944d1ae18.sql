
-- Drop existing function with old signature
DROP FUNCTION IF EXISTS public.get_pending_registrations();

-- Recreate with resident_type included
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE(
  id uuid, first_name text, middle_name text, last_name text, 
  email text, contact_number text, birth_date date, 
  place_of_origin text, approval_status text, 
  created_at timestamp with time zone, resident_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: staff role required';
  END IF;
  
  RETURN QUERY 
  SELECT r.id, r.first_name, r.middle_name, r.last_name, r.email, 
         r.contact_number, r.birth_date, r.place_of_origin, r.approval_status, 
         r.created_at, r.resident_type
  FROM residents r
  WHERE r.approval_status = 'pending' AND r.deleted_at IS NULL;
END;
$$;

-- Create duplicate detection function
CREATE OR REPLACE FUNCTION public.get_duplicate_resident_hints(
  p_first_name text,
  p_last_name text,
  p_birth_date date DEFAULT NULL,
  p_address text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, first_name text, middle_name text, last_name text,
  birth_date date, email text, contact_number text,
  household_id uuid, household_number text, household_address text,
  approval_status text, match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.first_name, r.middle_name, r.last_name,
    r.birth_date, r.email, r.contact_number,
    r.household_id, h.household_number, h.address AS household_address,
    r.approval_status,
    (
      CASE WHEN LOWER(r.first_name) = LOWER(p_first_name) AND LOWER(r.last_name) = LOWER(p_last_name) THEN 50 ELSE 0 END
      + CASE WHEN p_birth_date IS NOT NULL AND r.birth_date = p_birth_date THEN 30 ELSE 0 END
      + CASE WHEN p_address IS NOT NULL AND r.place_of_origin ILIKE '%' || p_address || '%' THEN 20 ELSE 0 END
    )::integer AS match_score
  FROM residents r
  LEFT JOIN households h ON h.id = r.household_id
  WHERE r.deleted_at IS NULL
    AND r.approval_status = 'approved'
    AND (
      (LOWER(r.first_name) ILIKE '%' || LOWER(p_first_name) || '%' AND LOWER(r.last_name) ILIKE '%' || LOWER(p_last_name) || '%')
      OR (p_birth_date IS NOT NULL AND r.birth_date = p_birth_date AND LOWER(r.last_name) ILIKE '%' || LOWER(p_last_name) || '%')
    )
  ORDER BY match_score DESC
  LIMIT 5;
END;
$$;
