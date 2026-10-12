# Phase 3 — Flow 2 Training V2 review

Branch: `feat/hrcms-auth-f01-f02-bao`. HEAD before and after implementation: `70edb1e6cba7488a926e2ab6748befdfa5c54ac5` (no commit). The checked-in `origin/main` ref and HEAD were identical at review time; no fetch or merge was performed.

All 13 canonical nodes were read from Figma file `9YyXkWnlyH7JP1Cw5BymHX`. The legacy F02.01–F02.06 screens were not used. Colors, cards, sidebar, form grid, tables, and fonts are scoped to Training. The fonts are bundled under `public/fonts/training/` with OFL license files. The functional spec DOCX was not present in the accessible local source tree.

## Implementation matrix

“Implemented” means the Frontend code path exists and passes lint/build/automated regression. It does **not** mean authenticated browser UAT or visual signoff. No authenticated safe Backend session was available for 1440×900, 768px, or 375px captures; all rows therefore have visual status **unverified**.

| Screen | Figma node | Implementation | Visual status | Functional status | Remaining gap |
|---|---|---|---|---|---|
| F02-01 Template List | `2790:3081` | Scoped table, available badge, details/edit/archive actions | Unverified | API path and HeadTrainer guard retained; automated suite passes | No live HeadTrainer UAT; list API has no search/status filter and returns only available templates |
| F02-02 Create/Edit Template | `2790:3145` | Three-column form inside list page | Unverified | Existing validation, mutation lock and archive flow retained | Figma separate-page presentation remains an inline form; no live mutation test |
| F02-03 Plan List | `2790:3243` | Scoped table, status, pagination, current-page search | Unverified | API list and Trainer create scope retained | No server-wide search/status filter; current-page search is labeled accordingly |
| F02-04 Create Plan | `2790:3306` | Form, assigned trainer display, medical summary | Unverified | Existing payload/validation/role checks retained | No live medical restriction or create UAT |
| F02-05 Plan Detail | `2790:3398` | Overview, sessions/history, restrictions, read-only state | Unverified | Existing edit/status/history logic retained | Calendar/timeline presentation differs from Figma; no live status transition UAT |
| F02-06 Session Schedule | `2793:3081` | Date/status filters and responsive session cards | Unverified | API date/status pagination retained | Figma calendar/date navigation is not implemented; no live schedule UAT |
| F02-07 Create/Edit Session | `2793:3127` | Form, rider choice, medical summary, edit confirmation | Unverified | Existing `DurationMinutes`, payload, pending/uncertain and 403/409 handling retained | Native browser confirmation and controls differ from Figma; no live create/edit UAT |
| F02-08 Session Detail / Assign Rider | `2793:3185` | Overview, edit/assign, result/history state, target vs actual | Unverified | Existing role/status checks and mutation paths retained | No live assignment/conflict UAT |
| F02-09 Rider My Schedule | `2793:3282` | Rider route, scoped session cards and today/upcoming/earlier groups | Unverified | Backend WorkRider list scope verified in source; route test passes | Grouping applies to the loaded page; no Rider login UAT |
| F02-10 Rider Session Detail | `2793:3324` | Rider route reuses session detail/start/result/skip | Unverified | Existing role/status checks retained | No live Rider action or mobile UAT |
| F02-11 Awaiting Evaluation | `2796:3081` | Trainer route, completed/issue filters and queue table | Unverified | Role route test passes; detail checks authoritative evaluation state | **Blocked by Backend:** list has no `evaluated` filter/state, so the table may include already evaluated sessions |
| F02-12 Evaluation Detail | `2796:3184` | Target vs actual, result, comment, evaluation action | Unverified | Existing duplicate guard, `AdjustFutureSessions` semantics and mutation handling retained | No live evaluation/conflict UAT |
| F02-13 Training Dashboard | `2796:3481` | KPI cards, status distribution, trend, planned vs actual, date/group filters | Unverified | Reads scoped `/api/dashboard` and bounded complete `/api/reports`; no fabricated totals | No live report UAT; chart and table presentation differ from Figma |

## Checkpoints and preserved behavior

| Checkpoint | Files | Preserved paths | Verification and limitations |
|---|---|---|---|
| 3.1 Templates | `TemplatePages.jsx`, `training-v2.css` | HeadTrainer create/edit/archive, pagination, mutation handling | Automated suite passed; live UI/API not run |
| 3.2 Plans | `PlanPages.jsx`, `TrainingMedicalContext.jsx` | Plan payload, scope, status/history, archived read-only | Automated suite passed; medical display needs live UAT |
| 3.3 Sessions | `SessionPages.jsx` | `DurationMinutes`, assignment, start/result/skip, pending/uncertain, errors | Lint/build and automated suite passed; calendar gap remains |
| 3.4 Rider | `AppRoutes.jsx`, `navigation.js`, `SessionPages.jsx` | Backend Rider scope and existing action guards | Route boundary test added; no Rider account/session |
| 3.5 Evaluation | `EvaluationPages.jsx`, `SessionPages.jsx` | Evaluation write semantics and duplicate guard | Backend list-filter dependency remains |
| 3.6 Dashboard | `TrainingDashboard.jsx` | API role scope and report limits | Both read endpoints verified against local Backend source; no live response |
| 3.7 Responsive and regression | `training-v2.css`, `tests/routing.test.js` | Phase 2 files and flow routes | CSS breakpoints at 1050/768/420; browser overflow and screenshots unverified |

## Backend dependencies

- `GET /api/training/sessions`: no evaluation-state filter. A true “awaiting evaluation” queue requires server-side filtering (and ideally an evaluation status in each list row) before pagination. Frontend must not infer it from incomplete pages.
- `GET /api/training/plans` and `GET /api/training/sessions`: no server search parameter. Search is now explicitly limited to the currently loaded page. Full-list search needs an API contract.
- `GET /api/training/templates`: returns non-archived templates and has no search/status filter. The available badge describes that response; an archived/all filter needs an API contract.
- `/api/reports` already supports complete, bounded, role-scoped aggregates for the requested date range. No aggregate API change is required for the implemented KPI/trend view.

## Verification and visual gaps

- Final automated results: `npm run lint` pass; `npm run build` pass (existing >500 kB chunk warning); `npm test` 211 passed, 0 failed; `git diff --check` pass (line-ending warning on `TemplatePages.jsx`).
- Browser UAT, medical safety transitions, confirmation dialogs, horizontal overflow, and pixel comparison at desktop 1440×900, tablet 768px and mobile 375px are **not verified**. No fixture screenshots are represented as production UI.
- The Figma V2 header/sidebar, cards, color tokens and font families were implemented. Remaining visual differences include native input/select/date controls, inline template editor, list cards in place of the calendar, and simplified dashboard charts.
- Phase 2 Auth, Registration, Review, Horse Profile, `src/style/flow-one.css`, and `docs/phase2-screenshots/` were preserved. No Backend source was edited and no live write requests or migrations were made.

**Readiness: BLOCKED** for full Phase 3 acceptance until the Backend evaluation queue contract and authenticated visual/functional UAT are available. The current Frontend changes are ready for review as an uncommitted working tree.
