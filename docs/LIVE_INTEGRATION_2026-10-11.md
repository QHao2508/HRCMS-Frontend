# Live frontend/backend integration — 2026-10-11

Backend main was pulled from e2ebf8a to d5c71bf. Both applications were run together: Vite on 127.0.0.1:5173 proxies the .NET API on localhost:5299.

Azure SQL failed with a post-login timeout. Testing therefore used an isolated SQL Express database, HRCMS_Integration_20261011_1328d207_Test, with current migrations, disposable fixture accounts, local file storage and background workers disabled. No production clinical data was changed. Azure connectivity and Azure storage remain unverified.

## Fixes

- Follow-up clearance now sends explicit restriction, injury and treatment IDs. The form supports partial clearance with Monitoring status, rejects empty/duplicate/ineligible selections, and reads every page of scoped records. It no longer promises global closure or automatic training resumption.
- Examination correction preserves the original examination timestamp, including seconds and fractional precision. The timestamp field is disabled while correcting an existing record.
- Live integration tests use the native SSR dependency bridge on Windows. An optional HRCMS_LIVE_ROLES=1 checks all seven fixture roles without enabling the separate mutating fixture suite.

## Verification

- Backend Release build: zero warnings/errors. Backend tests: 145 passed, one skipped (Azure storage fixture), zero failures.
- Frontend: 199 tests passed; ESLint and production build passed. The existing approximately 698 kB bundle warning remains.
- Live service test: health, login, metadata, dashboard, horses and logout passed. Login/dashboard/horses passed for all seven roles.
- Browser: veterinarian login, follow-up and record correction passed against the real API. Database verification confirmed only the selected restriction was cleared; the other restriction remained open, the injury remained active and treatment remained incomplete.
- The corrected record and original retained exactly the same stored examination timestamp (639271185565656349 ticks), and the new record references the original via SupersedesRecordId.

Coverage does not claim every page or every business workflow was exercised manually.
