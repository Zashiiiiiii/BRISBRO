
DROP FUNCTION IF EXISTS public.get_all_residents_for_staff();

CREATE OR REPLACE FUNCTION public.get_all_residents_for_staff()
 RETURNS TABLE(
   id uuid, first_name text, middle_name text, last_name text, suffix text,
   birth_date date, gender text, civil_status text, contact_number text, email text,
   religion text, ethnic_group text, place_of_origin text, dialects_spoken jsonb,
   schooling_status text, education_attainment text, employment_status text,
   employment_category text, occupation text, monthly_income_cash text,
   monthly_income_kind text, livelihood_training text, relation_to_head text,
   is_head_of_household boolean, household_id uuid, user_id uuid,
   created_at timestamptz, updated_at timestamptz,
   household_number text, household_street_purok text, household_address text,
   household_barangay text, household_city text, household_province text,
   household_house_number text, household_district text,
   household_place_of_origin text, household_ethnic_group text,
   household_house_ownership text, household_lot_ownership text,
   household_dwelling_type text, household_lighting_source text,
   household_water_supply_level text, household_years_staying integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.first_name, r.middle_name, r.last_name, r.suffix,
    r.birth_date, r.gender, r.civil_status, r.contact_number, r.email,
    r.religion, r.ethnic_group, r.place_of_origin, r.dialects_spoken,
    r.schooling_status, r.education_attainment, r.employment_status,
    r.employment_category, r.occupation, r.monthly_income_cash,
    r.monthly_income_kind, r.livelihood_training, r.relation_to_head,
    r.is_head_of_household, r.household_id, r.user_id,
    r.created_at, r.updated_at,
    h.household_number, h.street_purok AS household_street_purok,
    h.address AS household_address, h.barangay AS household_barangay,
    h.city AS household_city, h.province AS household_province,
    h.house_number AS household_house_number, h.district AS household_district,
    h.place_of_origin AS household_place_of_origin,
    h.ethnic_group AS household_ethnic_group,
    h.house_ownership AS household_house_ownership,
    h.lot_ownership AS household_lot_ownership,
    h.dwelling_type AS household_dwelling_type,
    h.lighting_source AS household_lighting_source,
    h.water_supply_level AS household_water_supply_level,
    h.years_staying AS household_years_staying
  FROM residents r
  LEFT JOIN households h ON h.id = r.household_id
  WHERE r.deleted_at IS NULL
    AND r.approval_status = 'approved'
  ORDER BY r.last_name, r.first_name;
END;
$function$;
