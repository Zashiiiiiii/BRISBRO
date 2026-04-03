CREATE OR REPLACE FUNCTION public.staff_save_ecological_census(
  p_household_id uuid,
  p_household_number text,
  p_respondent_name text DEFAULT NULL,
  p_respondent_relation text DEFAULT NULL,
  p_interview_date text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_house_number text DEFAULT NULL,
  p_street_purok text DEFAULT NULL,
  p_barangay text DEFAULT 'Sample Barangay',
  p_city text DEFAULT 'Sample City',
  p_province text DEFAULT 'Sample Province',
  p_district text DEFAULT NULL,
  p_years_staying integer DEFAULT NULL,
  p_place_of_origin text DEFAULT NULL,
  p_ethnic_group text DEFAULT NULL,
  p_dwelling_type text DEFAULT NULL,
  p_house_ownership text DEFAULT NULL,
  p_lot_ownership text DEFAULT NULL,
  p_water_supply_level text DEFAULT NULL,
  p_lighting_source text DEFAULT NULL,
  p_is_4ps_beneficiary boolean DEFAULT false,
  p_toilet_facilities jsonb DEFAULT NULL,
  p_drainage_facilities jsonb DEFAULT NULL,
  p_garbage_disposal jsonb DEFAULT NULL,
  p_water_storage jsonb DEFAULT NULL,
  p_food_storage_type jsonb DEFAULT NULL,
  p_communication_services jsonb DEFAULT NULL,
  p_info_sources jsonb DEFAULT NULL,
  p_means_of_transport jsonb DEFAULT NULL,
  p_household_members jsonb DEFAULT NULL,
  p_education_data jsonb DEFAULT NULL,
  p_health_data jsonb DEFAULT NULL,
  p_animals jsonb DEFAULT NULL,
  p_food_production jsonb DEFAULT NULL,
  p_family_planning jsonb DEFAULT NULL,
  p_pwd_count integer DEFAULT 0,
  p_solo_parent_count integer DEFAULT 0,
  p_senior_data jsonb DEFAULT NULL,
  p_pregnant_data jsonb DEFAULT NULL,
  p_immunization_data jsonb DEFAULT NULL,
  p_disability_data jsonb DEFAULT NULL,
  p_death_data jsonb DEFAULT NULL,
  p_additional_notes text DEFAULT NULL,
  p_staff_id text DEFAULT NULL,
  p_consent_datetime timestamptz DEFAULT NULL,
  p_interviewer_name text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_submission_number TEXT;
  v_submission_id UUID;
  v_interview_date DATE;
BEGIN
  IF p_interview_date IS NOT NULL AND p_interview_date != '' THEN
    v_interview_date := p_interview_date::DATE;
  ELSE
    v_interview_date := NULL;
  END IF;

  SELECT id, submission_number INTO v_submission_id, v_submission_number
  FROM ecological_profile_submissions
  WHERE household_number = p_household_number
    AND status = 'approved'
    AND deleted_at IS NULL
  ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF v_submission_id IS NOT NULL THEN
    UPDATE ecological_profile_submissions SET
      household_id = p_household_id,
      respondent_name = p_respondent_name,
      respondent_relation = p_respondent_relation,
      interview_date = v_interview_date,
      interviewer_name = p_interviewer_name,
      consent_datetime = p_consent_datetime,
      address = p_address,
      house_number = p_house_number,
      street_purok = p_street_purok,
      barangay = p_barangay,
      city = p_city,
      province = p_province,
      district = p_district,
      years_staying = p_years_staying,
      place_of_origin = p_place_of_origin,
      ethnic_group = p_ethnic_group,
      dwelling_type = p_dwelling_type,
      house_ownership = p_house_ownership,
      lot_ownership = p_lot_ownership,
      water_supply_level = p_water_supply_level,
      lighting_source = p_lighting_source,
      is_4ps_beneficiary = p_is_4ps_beneficiary,
      toilet_facilities = p_toilet_facilities,
      drainage_facilities = p_drainage_facilities,
      garbage_disposal = p_garbage_disposal,
      water_storage = p_water_storage,
      food_storage_type = p_food_storage_type,
      communication_services = p_communication_services,
      info_sources = p_info_sources,
      means_of_transport = p_means_of_transport,
      household_members = p_household_members,
      education_data = p_education_data,
      health_data = p_health_data,
      animals = p_animals,
      food_production = p_food_production,
      family_planning = p_family_planning,
      pwd_count = p_pwd_count,
      solo_parent_count = p_solo_parent_count,
      senior_data = p_senior_data,
      pregnant_data = p_pregnant_data,
      immunization_data = p_immunization_data,
      disability_data = p_disability_data,
      death_data = p_death_data,
      additional_notes = p_additional_notes,
      reviewed_by = p_staff_id,
      reviewed_at = NOW(),
      updated_at = NOW(),
      staff_notes = 'Staff-entered census data (updated)'
    WHERE id = v_submission_id;

    PERFORM apply_ecological_submission_to_household(v_submission_id);
    RETURN v_submission_number;
  ELSE
    v_submission_number := 'EP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    INSERT INTO ecological_profile_submissions (
      submission_number, household_id, household_number,
      respondent_name, respondent_relation, interview_date, interviewer_name, consent_datetime,
      address, house_number, street_purok, barangay, city, province, district,
      years_staying, place_of_origin, ethnic_group, dwelling_type, house_ownership, lot_ownership,
      water_supply_level, lighting_source, is_4ps_beneficiary,
      toilet_facilities, drainage_facilities, garbage_disposal, water_storage, food_storage_type,
      communication_services, info_sources, means_of_transport,
      household_members, education_data, health_data, animals, food_production,
      family_planning, pwd_count, solo_parent_count, senior_data, pregnant_data,
      immunization_data, disability_data, death_data, additional_notes,
      status, reviewed_by, reviewed_at, staff_notes
    ) VALUES (
      v_submission_number, p_household_id, p_household_number,
      p_respondent_name, p_respondent_relation, v_interview_date, p_interviewer_name, p_consent_datetime,
      p_address, p_house_number, p_street_purok, p_barangay, p_city, p_province, p_district,
      p_years_staying, p_place_of_origin, p_ethnic_group, p_dwelling_type, p_house_ownership, p_lot_ownership,
      p_water_supply_level, p_lighting_source, p_is_4ps_beneficiary,
      p_toilet_facilities, p_drainage_facilities, p_garbage_disposal, p_water_storage, p_food_storage_type,
      p_communication_services, p_info_sources, p_means_of_transport,
      p_household_members, p_education_data, p_health_data, p_animals, p_food_production,
      p_family_planning, p_pwd_count, p_solo_parent_count, p_senior_data, p_pregnant_data,
      p_immunization_data, p_disability_data, p_death_data, p_additional_notes,
      'approved', p_staff_id, NOW(), 'Staff-entered census data'
    )
    RETURNING id INTO v_submission_id;

    PERFORM apply_ecological_submission_to_household(v_submission_id);
    RETURN v_submission_number;
  END IF;
END;
$function$;