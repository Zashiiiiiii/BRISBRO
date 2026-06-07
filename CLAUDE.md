# BRISPRO — Project Context (read this first)

> This file primes any new Claude Code chat. Read it fully before acting.

## What this is

**BRISPRO — Barangay Salud Mitra Resident Information System (RIS)**, Baguio City.
A capstone web app digitizing a paper-based barangay records system.

- **Academic:** BSIT Major in Network & Security — **Capstone 2** (completion).
  Panel is reviewing the manuscript + system. On approval of both → they sign →
  **final defense**.
- **Defense flow (important):** present → demo → **debugging stage where the panel
  gives a surprise feature to implement on the spot**. Finish that feature → pass.
  → Keep the codebase easy to extend fast.
- **Users:** residents + (mostly) the **barangay secretary**.
- **Data:** demo only — no real partner data needed. Fresh dummy admin/residents are fine.

## Stack

React 19 · Vite · TypeScript · Tailwind · shadcn/ui · React Router v6 · TanStack Query ·
Supabase (auth, Postgres, 7 edge functions). Built originally in Lovable.

## Architecture (3 portals)

| Portal | Auth | Key areas |
|--------|------|-----------|
| **Public** | none | certificate request, track status, contact |
| **Resident** | Supabase native auth (`supabase.auth`) | profile, certificate requests, incidents, ecological profile, messages |
| **Staff/Admin** | custom session via `staff-auth` edge function (httpOnly cookie + `x-staff-token` fallback) | residents/households registry, cert approval, incident/blotter, ecological census, RBI Form C (monitoring reports), analytics, name-change + resident approval, messaging |

Roles: `admin`, `secretary`. RLS enforced; residents see only their own data (`user_id = auth.uid()`), staff gated by `has_role()`.

### Core abstractions (from knowledge graph — where everything routes)
- `src/lib/utils.ts` → `cn()` — styling util (most-connected)
- `src/components/staff/*` + `src/utils/staffApi.ts` → `callStaffApi()` — **staff data gateway**
- `src/integrations/supabase/client.ts` → `supabase` — **data spine, reaches every feature**
- `src/hooks/useStaffAuth.ts` → `useStaffAuthContext()` — staff session
- Edge function `supabase/functions/staff-auth/index.ts` — 3,300-line god-function, 58 guarded actions

→ **Surprise feature plug points:** staff feature → goes through `callStaffApi()` + `staff-auth`.
Resident feature → `supabase` directly.

## Knowledge graph

Full codebase graph at `graphify-out/graph.json` (gitignored). Query it:
```
graphify query "<question>"
```
1,102 nodes · 2,995 edges · 66 communities. Rebuild: `graphify <path>`.

## Local dev

```
npm install --legacy-peer-deps   # React 19 vs next-themes peer conflict
npm run dev                      # http://localhost:8080
```
`.env` holds VITE_SUPABASE_* (anon key — public, safe to commit per Lovable convention).

### CRITICAL local-dev note — staff login CORS
The `staff-auth` edge function restricts CORS to production/Lovable origins, so
`http://localhost` is blocked. Fixed via a **Vite dev proxy**: `vite.config.ts`
proxies `/functions` → Supabase, and the 3 staff-auth fetch call sites
(`useStaffAuth.ts`, `staff/CertificateTypeManagement.tsx`, `staff/SettingsTab.tsx`)
use a same-origin path in dev. Production paths unchanged. **Must restart dev
server after pulling vite.config changes.**

## Current state (as of this writing)

Branch: `fix/react-hooks-deps` (2 commits ahead of `main`):
- `f72f3a4` — fixed all 23 `react-hooks/exhaustive-deps` warnings (useCallback for leaf
  loaders; documented eslint-disable for subscription/lifecycle effects)
- `eb0d3dc` — staff-auth Vite proxy (local login fix) + Router v7 future flags + gitignore graphify-out

Build passes. Security audit done: edge-function auth solid, RLS correct, no secrets in frontend.

### ⚠️ Supabase situation (BLOCKER for live data)
- Original Lovable Supabase project (`letwsilupoqpluwqyyck`) was **paused too long → cannot
  be restored via dashboard.**
- A Dec 2025 backup exists (`C:\Users\dales\Downloads\db_cluster-14-12-2025@15-27-50.backup.gz`)
  but it's an OLD snapshot: 1 staff admin (`admin`/`admin123`), 2 dummy residents, 7 cert
  requests, 1 auth user (`admin@gmail.com`). The newer panelist-consultation data is NOT in it.
- **Decision: skip restoring old data; create fresh admin/residents** in a NEW Supabase project.
- New project provisioned: `quqyzzqsbdycdnanobid` (URL https://quqyzzqsbdycdnanobid.supabase.co).
  Direct DB host is IPv6-only — use the **Session pooler** connection string for psql/CLI.
- `psql` (PostgreSQL 17) is installed at `C:\Program Files\PostgreSQL\17\bin`.
- Edge-function secrets needed on the new project: `ADMIN_INITIAL_PASSWORD`, `ALLOWED_ORIGINS`
  (must include localhost + new domain), `RESEND_API_KEY` (email — user has a Resend key,
  rotate it since it was pasted in chat), `LOVABLE_API_KEY` (optional, Tagalog translate).
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are auto-provided by Supabase.

### Next steps
1. Link new Supabase project (`supabase login` → `supabase link --project-ref quqyzzqsbdycdnanobid`).
2. Push schema: 73 migrations in `supabase/migrations/` → `supabase db push`.
3. Deploy 7 edge functions → set secrets above.
4. Update `.env` → new project URL + anon (publishable) key `sb_publishable_quw2kpxMLPeWWQnWcxi8NQ_tP6oTIfh`.
5. Bootstrap a fresh admin + a few test residents.
6. Test login (staff + resident) locally via the proxy.

## Conventions
- Caveman response mode is active in this user's setup (terse; code/commits written normally).
- Commit only when the user asks. No `Co-Authored-By` trailer (attribution not set).
- Keep files < 500 lines; read before edit; never commit secrets/.env.
