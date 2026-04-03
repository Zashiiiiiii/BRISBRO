
DROP FUNCTION IF EXISTS public.get_name_change_requests_for_staff(text);

CREATE OR REPLACE FUNCTION public.get_name_change_requests_for_staff(p_status text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, resident_id uuid, current_first_name text, current_middle_name text, current_last_name text, current_suffix text, requested_first_name text, requested_middle_name text, requested_last_name text, requested_suffix text, reason text, status text, reviewed_by text, reviewed_at timestamp with time zone, rejection_reason text, created_at timestamp with time zone, resident_email text, resident_contact text, proof_document_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ncr.id,
    ncr.resident_id,
    ncr.current_first_name,
    ncr.current_middle_name,
    ncr.current_last_name,
    ncr.current_suffix,
    ncr.requested_first_name,
    ncr.requested_middle_name,
    ncr.requested_last_name,
    ncr.requested_suffix,
    ncr.reason,
    ncr.status,
    ncr.reviewed_by,
    ncr.reviewed_at,
    ncr.rejection_reason,
    ncr.created_at,
    r.email as resident_email,
    r.contact_number as resident_contact,
    ncr.proof_document_url
  FROM name_change_requests ncr
  JOIN residents r ON r.id = ncr.resident_id
  WHERE (p_status IS NULL OR ncr.status = p_status)
  ORDER BY ncr.created_at DESC;
END;
$function$;
