
-- Fix get_pending_registrations: drop first to change return type
DROP FUNCTION IF EXISTS public.get_pending_registrations();

CREATE OR REPLACE FUNCTION public.get_pending_registrations()
 RETURNS TABLE(id uuid, first_name text, middle_name text, last_name text, email text, contact_number text, birth_date date, place_of_origin text, approval_status text, created_at timestamptz)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY 
  SELECT r.id, r.first_name, r.middle_name, r.last_name, r.email, 
         r.contact_number, r.birth_date, r.place_of_origin, r.approval_status, 
         r.created_at
  FROM residents r
  WHERE r.approval_status = 'pending' AND r.deleted_at IS NULL;
END;
$function$;

-- Fix apply_ecological_submission_to_household: consolidate household_members after processing
CREATE OR REPLACE FUNCTION public.apply_ecological_submission_to_household(p_submission_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_submission public.ecological_profile_submissions%ROWTYPE;
  v_household_id UUID;
  v_member JSONB;
  v_member_birth_date DATE;
  v_existing_resident_id UUID;
  v_member_first_name TEXT;
  v_member_middle_name TEXT;
  v_member_last_name TEXT;
  v_is_head BOOLEAN;
  v_consolidated_members JSONB;
BEGIN
  SELECT * INTO v_submission FROM public.ecological_profile_submissions WHERE id = p_submission_id;
  
  IF v_submission IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  IF v_submission.status != 'approved' THEN
    RAISE EXCEPTION 'Only approved submissions can be applied';
  END IF;
  
  IF v_submission.household_id IS NOT NULL THEN
    v_household_id := v_submission.household_id;
  ELSE
    SELECT id INTO v_household_id 
    FROM public.households 
    WHERE household_number = v_submission.household_number;
  END IF;
  
  IF v_household_id IS NOT NULL THEN
    UPDATE public.households SET
      household_number = COALESCE(v_submission.household_number, household_number),
      address = COALESCE(v_submission.address, address),
      house_number = COALESCE(v_submission.house_number, house_number),
      street_purok = COALESCE(v_submission.street_purok, street_purok),
      district = COALESCE(v_submission.district, district),
      barangay = COALESCE(v_submission.barangay, barangay),
      city = COALESCE(v_submission.city, city),
      province = COALESCE(v_submission.province, province),
      years_staying = COALESCE(v_submission.years_staying, years_staying),
      place_of_origin = COALESCE(v_submission.place_of_origin, place_of_origin),
      ethnic_group = COALESCE(v_submission.ethnic_group, ethnic_group),
      house_ownership = COALESCE(v_submission.house_ownership, house_ownership),
      lot_ownership = COALESCE(v_submission.lot_ownership, lot_ownership),
      dwelling_type = COALESCE(v_submission.dwelling_type, dwelling_type),
      lighting_source = COALESCE(v_submission.lighting_source, lighting_source),
      water_supply_level = COALESCE(v_submission.water_supply_level, water_supply_level),
      water_storage = COALESCE(v_submission.water_storage, water_storage),
      food_storage_type = COALESCE(v_submission.food_storage_type, food_storage_type),
      toilet_facilities = COALESCE(v_submission.toilet_facilities, toilet_facilities),
      drainage_facilities = COALESCE(v_submission.drainage_facilities, drainage_facilities),
      garbage_disposal = COALESCE(v_submission.garbage_disposal, garbage_disposal),
      communication_services = COALESCE(v_submission.communication_services, communication_services),
      means_of_transport = COALESCE(v_submission.means_of_transport, means_of_transport),
      info_sources = COALESCE(v_submission.info_sources, info_sources),
      interview_date = COALESCE(v_submission.interview_date, interview_date),
      updated_at = now()
    WHERE id = v_household_id;
    
    IF v_submission.household_id IS NULL THEN
      UPDATE public.ecological_profile_submissions SET household_id = v_household_id WHERE id = p_submission_id;
    END IF;
  ELSE
    INSERT INTO public.households (
      household_number, address, house_number, street_purok, district,
      barangay, city, province, years_staying, place_of_origin, ethnic_group,
      house_ownership, lot_ownership, dwelling_type, lighting_source, water_supply_level,
      water_storage, food_storage_type, toilet_facilities, drainage_facilities,
      garbage_disposal, communication_services, means_of_transport, info_sources,
      interview_date
    ) VALUES (
      v_submission.household_number, v_submission.address, v_submission.house_number,
      v_submission.street_purok, v_submission.district, v_submission.barangay,
      v_submission.city, v_submission.province, v_submission.years_staying,
      v_submission.place_of_origin, v_submission.ethnic_group, v_submission.house_ownership,
      v_submission.lot_ownership, v_submission.dwelling_type, v_submission.lighting_source,
      v_submission.water_supply_level, v_submission.water_storage, v_submission.food_storage_type,
      v_submission.toilet_facilities, v_submission.drainage_facilities, v_submission.garbage_disposal,
      v_submission.communication_services, v_submission.means_of_transport, v_submission.info_sources,
      v_submission.interview_date
    )
    RETURNING id INTO v_household_id;
    
    UPDATE public.ecological_profile_submissions SET household_id = v_household_id WHERE id = p_submission_id;
  END IF;
  
  -- Link the submitting resident to the household
  IF v_submission.submitted_by_resident_id IS NOT NULL THEN
    UPDATE public.residents
    SET household_id = v_household_id, updated_at = now()
    WHERE id = v_submission.submitted_by_resident_id
      AND household_id IS NULL;
  END IF;
  
  -- Process household members from JSON array
  IF v_submission.household_members IS NOT NULL AND jsonb_array_length(v_submission.household_members) > 0 THEN
    FOR v_member IN SELECT * FROM jsonb_array_elements(v_submission.household_members)
    LOOP
      v_member_first_name := COALESCE(
        v_member->>'first_name',
        TRIM(split_part(COALESCE(v_member->>'full_name', ''), ' ', 1))
      );
      v_member_last_name := COALESCE(
        v_member->>'last_name',
        TRIM(CASE 
          WHEN array_length(string_to_array(COALESCE(v_member->>'full_name', ''), ' '), 1) > 2 THEN
            (string_to_array(COALESCE(v_member->>'full_name', ''), ' '))[array_length(string_to_array(COALESCE(v_member->>'full_name', ''), ' '), 1)]
          ELSE
            split_part(COALESCE(v_member->>'full_name', ''), ' ', 2)
        END)
      );
      v_member_middle_name := COALESCE(
        v_member->>'middle_name',
        TRIM(CASE 
          WHEN array_length(string_to_array(COALESCE(v_member->>'full_name', ''), ' '), 1) > 2 THEN
            (string_to_array(COALESCE(v_member->>'full_name', ''), ' '))[2]
          ELSE
            NULL
        END)
      );
      
      v_member_birth_date := NULL;
      IF v_member->>'birth_date' IS NOT NULL AND v_member->>'birth_date' != '' THEN
        BEGIN
          v_member_birth_date := (v_member->>'birth_date')::DATE;
        EXCEPTION WHEN OTHERS THEN
          v_member_birth_date := NULL;
        END;
      END IF;
      
      v_is_head := COALESCE(
        (v_member->>'is_head_of_household')::BOOLEAN,
        LOWER(COALESCE(v_member->>'relationship_to_head', v_member->>'relation_to_head', '')) = 'head',
        FALSE
      );
      
      v_existing_resident_id := NULL;
      IF v_member_first_name IS NOT NULL AND v_member_first_name != '' THEN
        SELECT id INTO v_existing_resident_id
        FROM public.residents
        WHERE household_id = v_household_id
          AND LOWER(first_name) = LOWER(v_member_first_name)
          AND LOWER(last_name) = LOWER(COALESCE(v_member_last_name, ''))
          AND (v_member_birth_date IS NULL OR birth_date = v_member_birth_date)
          AND deleted_at IS NULL
        LIMIT 1;
      END IF;
      
      IF v_existing_resident_id IS NOT NULL THEN
        UPDATE public.residents SET
          middle_name = COALESCE(v_member_middle_name, middle_name),
          gender = COALESCE(v_member->>'gender', gender),
          birth_date = COALESCE(v_member_birth_date, birth_date),
          civil_status = COALESCE(v_member->>'civil_status', civil_status),
          religion = COALESCE(v_member->>'religion', religion),
          contact_number = COALESCE(v_member->>'contact_number', contact_number),
          occupation = COALESCE(v_member->>'occupation', occupation),
          relation_to_head = COALESCE(v_member->>'relationship_to_head', v_member->>'relation_to_head', relation_to_head),
          education_attainment = COALESCE(v_member->>'education_level', v_member->>'education_attainment', education_attainment),
          schooling_status = COALESCE(v_member->>'schooling_status', schooling_status),
          employment_status = COALESCE(v_member->>'employment_status', employment_status),
          employment_category = COALESCE(v_member->>'employment_category', employment_category),
          monthly_income_cash = COALESCE(v_member->>'monthly_income', v_member->>'monthly_income_cash', monthly_income_cash),
          monthly_income_kind = COALESCE(v_member->>'monthly_income_kind', monthly_income_kind),
          is_head_of_household = v_is_head,
          updated_at = now()
        WHERE id = v_existing_resident_id;
      ELSE
        IF v_member_first_name IS NOT NULL AND v_member_first_name != '' THEN
          INSERT INTO public.residents (
            household_id, first_name, middle_name, last_name, gender, birth_date,
            civil_status, religion, contact_number, occupation, relation_to_head,
            education_attainment, schooling_status, employment_status, employment_category,
            monthly_income_cash, monthly_income_kind, is_head_of_household, approval_status
          ) VALUES (
            v_household_id,
            v_member_first_name,
            v_member_middle_name,
            v_member_last_name,
            v_member->>'gender',
            v_member_birth_date,
            v_member->>'civil_status',
            v_member->>'religion',
            v_member->>'contact_number',
            v_member->>'occupation',
            COALESCE(v_member->>'relationship_to_head', v_member->>'relation_to_head'),
            COALESCE(v_member->>'education_level', v_member->>'education_attainment'),
            v_member->>'schooling_status',
            v_member->>'employment_status',
            v_member->>'employment_category',
            COALESCE(v_member->>'monthly_income', v_member->>'monthly_income_cash'),
            v_member->>'monthly_income_kind',
            v_is_head,
            'approved'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- CONSOLIDATE: Build household_members JSON from ALL current residents in this household
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', 'resident-' || r.id::text,
      'full_name', TRIM(CONCAT(r.first_name, ' ', COALESCE(r.middle_name || ' ', ''), r.last_name)),
      'first_name', r.first_name,
      'middle_name', r.middle_name,
      'last_name', r.last_name,
      'birth_date', r.birth_date::text,
      'age', EXTRACT(YEAR FROM age(CURRENT_DATE, r.birth_date))::integer,
      'gender', r.gender,
      'civil_status', r.civil_status,
      'religion', r.religion,
      'contact_number', r.contact_number,
      'occupation', r.occupation,
      'relationship_to_head', r.relation_to_head,
      'education_level', r.education_attainment,
      'schooling_status', r.schooling_status,
      'employment_status', r.employment_status,
      'employment_category', r.employment_category,
      'monthly_income', COALESCE(r.monthly_income_cash, ''),
      'monthly_income_kind', r.monthly_income_kind,
      'is_head_of_household', COALESCE(r.is_head_of_household, false),
      'is_pwd', false,
      'is_solo_parent', false,
      'is_tenant', LOWER(COALESCE(r.relation_to_head, '')) = 'tenant'
    )
    ORDER BY 
      CASE WHEN r.is_head_of_household THEN 0 ELSE 1 END,
      r.last_name, r.first_name
  )
  INTO v_consolidated_members
  FROM public.residents r
  WHERE r.household_id = v_household_id
    AND r.deleted_at IS NULL
    AND r.approval_status = 'approved';
  
  -- Update the current submission with consolidated members
  UPDATE public.ecological_profile_submissions
  SET household_members = COALESCE(v_consolidated_members, '[]'::jsonb),
      updated_at = now()
  WHERE id = p_submission_id;
  
  -- Also update any OTHER approved submissions for the same household
  UPDATE public.ecological_profile_submissions
  SET household_members = COALESCE(v_consolidated_members, '[]'::jsonb),
      updated_at = now()
  WHERE household_number = v_submission.household_number
    AND status = 'approved'
    AND deleted_at IS NULL
    AND id != p_submission_id;
  
  RETURN v_household_id;
END;
$function$;
