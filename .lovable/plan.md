

## Plan: Update Data Privacy Statement to Match Real Barangay Workflow

Two files to update: `DataPrivacyModal.tsx` (short modal) and `PrivacyPolicy.tsx` (full page).

### Changes to DataPrivacyModal.tsx

**1. "What Data We Collect"** — Rewrite to reflect Ecological Profile Census fields:
- Personal demographics (name, birth date, gender, civil status, contact details)
- Household information (address, purok, household composition, dwelling type, land ownership)
- Socioeconomic data (education, employment, estimated monthly income)
- Environmental sanitation (water source, waste management, toilet type)
- Sensitive information (health/disability/family planning) — labeled as restricted-access
- Transaction records (certificate requests, incident reports, messages)

**2. "Who Can Access Your Data"** — Replace with:
- Authorized Barangay Staff (Admin and Secretary) for processing and record-keeping
- Residents can view and manage only their own data through the resident portal
- Public tracking shows request status only — no personal data is exposed

**3. "Purpose of Data Collection"** — Replace with:
- Household profiling through the Ecological Profile Census
- Service delivery and program planning (certificates, 4Ps, etc.)
- Preparation of semi-annual monitoring reports (RBI Form C Revised 2024)
- Government compliance and statistical reporting
- Communication between residents and barangay staff

**4. Data Sharing** — Replace absolute "NOT shared" statement with nuanced version:
- Not shared with commercial third parties
- Aggregated statistical reports may be submitted to authorized government offices as required
- Personal data shared only when required by law or with the resident's consent

**5. Security Measures** — Remove "Regular security audits and monitoring" (no audit logs claim). Keep encryption, role-based access, secure backup.

**6. Last Updated** — Change to "March 2026"

### Changes to PrivacyPolicy.tsx (Full Page)

Mirror all the same content changes above, plus:
- Remove "System activity logs" and "Audit trails and activity logging" references
- Update "Data Access" section to match Admin/Secretary roles (remove Kapitan/Kagawad/SK Chairman)
- Update Purpose section to include household profiling and RBI Form C
- Update Data Sharing to use nuanced language
- Update footer version date to March 2026

### Technical Details
- Files: `src/components/DataPrivacyModal.tsx`, `src/pages/PrivacyPolicy.tsx`
- No database or backend changes needed
- Content-only updates to JSX

