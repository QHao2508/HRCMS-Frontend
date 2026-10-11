# Frontend branch integration — 2026-10-11

Base: `1755b66349fcc7c517cc3aeff1f6fb46793200df` (`main`).

| Branch | Reviewed tip | Resolution |
| --- | --- | --- |
| `feat/auth-f01-khoa` | `a80a335` | Integrated overdue plan badges; retained current search, Vietnamese labels and realtime behavior. |
| `khoa/home-page` | `9123be9` | Integrated through its descendant branch: homepage, bundled fonts, imagery and layout. |
| `khoa/manager-training-updates` | `bc95c05` | Integrated through its descendant branch: staff administration, audit, website content, and training search. |
| `khoa/cap-nhap-va-sua-theo-task` | `c07dcbe` | Integrated manager and training fixes, including read-only access to historical plans. |
| `feat/auth-f01-giabao` | `15efef2` | Reconciled using the current implementation. Its alternative horse/training/assignment components and older routes were not applied. Main already implements these workflows in `HorsePages`, `PlanPages`, `SessionPages`, `TemplatePages`, and `ReviewPages`. |
| `feat/auth-f01-clean` | `b31a027` | Reconciled using the current implementation. Its Figma UI replacement was not applied: current localized authentication, OTP, photo upload, realtime shell and registration wizard were retained. Main already prevents duplicate uncertain draft submissions. Dialog focus changes apply to a dialog absent from the current UI and were not transplanted. |
| `feat/medical` | `267a4d7` | Ported the medical module to the existing `src/pages`, `src/components`, `src/services`, and `src/style` structure; retained the current authentication provider and entry point. |
| `feat/training-f02-lac` | `2e40ce9` | Already an ancestor of main before this integration. |

## Medical corrections

- All six medical routes require the exact `Veterinarian` role. Other roles retain their existing horse and training views.
- Replaced the hardcoded dashboard horses, totals and clinician with scoped API data and the authenticated user.
- Used the existing Axios/session pipeline and URL-encoded horse/record identifiers.
- Disabled automatic replay for clinical writes, blocked duplicate in-flight writes, and required page reload after ambiguous responses. Definitive validation failures remain correctable.
- Retained active-response checks for horse selection and corrected examination effect dependencies.
- Moved displayed literals into the shared message catalog to satisfy existing lint rules. Some medical text remains English from the source branch.

## Verification

- `npm test`: 195 passed, 0 failed (174 existing checks plus 21 medical checks).
- `npm run lint`: passed.
- `npm run build`: passed; Vite reports an existing large-bundle warning.
- `git diff --check`: passed.
- API routes were checked against the local backend contract and the latest fetched backend history, which includes manager administration changes.
- Tests use adapters and SSR rendering; live deployed backend and interactive browser behavior were not exercised.

The SSR test helper bridges native dependencies into Vite's module runner on Windows while preserving React identity. It changes only the test harness.

No feature branches were deleted. The full experimental integration, including the unused alternative UI, remains available locally on `codex/merge-frontend-branches`; it is not the published implementation.
