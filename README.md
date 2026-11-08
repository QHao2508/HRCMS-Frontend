<div align="center">

# 🐎 HRCMS Frontend

**The web client of the Horse Racing Club Management System** — a role-based React application for owners, managers, trainers, riders, veterinarians and grooms.

[![Frontend CI](https://github.com/QHao2508/HRCMS-Frontend/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/QHao2508/HRCMS-Frontend/actions/workflows/frontend-ci.yml)
[![Deploy](https://github.com/QHao2508/HRCMS-Frontend/actions/workflows/azure-static-web-apps.yml/badge.svg)](https://github.com/QHao2508/HRCMS-Frontend/actions/workflows/azure-static-web-apps.yml)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React Router 7](https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white)
![SignalR](https://img.shields.io/badge/Realtime-SignalR-512BD4)
![Azure Static Web Apps](https://img.shields.io/badge/Hosted%20on-Azure%20Static%20Web%20Apps-0078D4?logo=microsoftazure&logoColor=white)

[**Live demo**](https://orange-ocean-04488bd00.1.azurestaticapps.net) ·
[Backend repository](https://github.com/QHao2508/HRCMS) ·
[Figma design](https://www.figma.com/design/AKLYJd26mWHeG1W8V0ach5/Figma-basics--Copy-?node-id=1669-162202) ·
[Documentation](docs/README.md)

<sub>SWP391 – Software Development Project · FPT University · Fall 2026 · Team 2</sub>

</div>

---

## 📌 Table of contents

- [Overview](#-overview)
- [Screens by module](#%EF%B8%8F-screens-by-module)
- [Highlights](#-highlights)
- [Tech stack](#-tech-stack)
- [Project structure](#-project-structure)
- [Getting started](#-getting-started)
- [Configuration](#%EF%B8%8F-configuration)
- [Quality checks](#-quality-checks)
- [Deployment](#%EF%B8%8F-deployment)
- [Documentation](#-documentation)
- [Team](#-team)

---

## 🔭 Overview

HRCMS keeps every horse’s journey in one place: **intake → assignment → training → veterinary care → daily care & stock.** This repository contains the single-page application; all business rules and permissions are enforced by the [ASP.NET Core backend](https://github.com/QHao2508/HRCMS).

- **7 roles**, each with its own navigation and dashboard: Horse Owner, Club Manager, Head Trainer, Trainer, Work Rider, Veterinarian and Groom (plus a public home page for guests).
- **34 page components**, each behind role-checked route guards.
- **Vietnamese interface**: the API returns message keys and the client translates them, so wording stays consistent across screens.

## 🖥️ Screens by module

| Module | Screens | Main roles |
| --- | --- | --- |
| **Account** | Login, Register (email OTP), Verify email, Forgot / Reset password, Accept invitation | Everyone |
| **Horse intake** | Registration list, multi-step create & edit (identity, pedigree, measurements, health, stay period, photos, certificates), registration detail | Horse Owner |
| **Review** | Review queue, review detail (approve / request revision with reason) | Club Manager |
| **Horses** | Horse list & profile, assignment form with trainer candidates and suitability reasons | Manager, Head Trainer |
| **Training** | Templates & trainer qualification, plans, sessions, rider execution & results, trainer evaluation | Head Trainer, Trainer, Work Rider |
| **Medical** | Medical dashboard, examinations, injuries, treatment plans, restrictions, follow-ups & clearance | Veterinarian |
| **Care & operations** | Preventive care, care tasks, incidents with photos, stables & stalls, inventory, reports | Groom, Vet, Manager |
| **Administration** | Staff management, audit log, website content | Club Manager |
| **Common** | Role dashboard, notification bell (realtime), public home page, permission denied, not found | Everyone |

## ✨ Highlights

- **Role-based routing** — `ProtectedRoute` restores the session before rendering; `RoleRoute` checks the exact backend role names in `src/constants/roles.js`. Hidden buttons are a convenience only; the backend re-checks every request.
- **Safe session handling** — opaque access/refresh tokens, one shared refresh on `401` with a single retry, no token decoding, and the user profile is always re-validated with `/api/auth/me` on startup.
- **Realtime updates** — a SignalR connection only signals that something changed; screens then reload through the permission-checked REST API.
- **Explainable rules in the UI** — unsuitable trainer candidates, blocked sessions, rejected clearances and over-stock issues all show the backend’s reason instead of a generic error.
- **Forms built for long workflows** — multi-step registration wizard, unsaved-change protection, client validation mirrored from backend contracts.

## 🧰 Tech stack

| Area | Technology |
| --- | --- |
| UI | React 19, React Router 7, Bootstrap 5, Lucide icons |
| Build | Vite 8 with an `/api`, `/hubs` dev proxy |
| Data & realtime | Axios API client, `@microsoft/signalr` |
| Quality | ESLint, Node.js built-in test runner (mocked Axios, no live backend needed) |
| Hosting | Azure Static Web Apps via GitHub Actions |

## 📁 Project structure

```text
HRCMS-Frontend/
├── public/               # Logo, images and fonts served as-is
├── src/
│   ├── pages/            # Screens: auth, registrations, reviews, horses, training, medical, support, manager
│   ├── components/       # Shared UI: workflow widgets, trainer candidates, notification bell, header…
│   ├── layouts/          # App shell (authenticated) and public layout
│   ├── routes/           # AppRoutes, ProtectedRoute, RoleRoute, role-filtered navigation
│   ├── services/         # API client, per-module services, validation and display helpers
│   ├── context/          # Auth and realtime providers, reusable hooks
│   ├── constants/        # Roles, permissions, enum and medical labels
│   ├── messages/         # Message keys and Vietnamese translations
│   └── style/            # Theme and per-module stylesheets
├── tests/                # Unit tests (node --test)
├── docs/                 # Integration, localization, deployment and function references
└── .github/workflows/    # frontend-ci.yml, azure-static-web-apps.yml
```

## 🚀 Getting started

### Prerequisites

- Node.js 24 (the version used in CI)
- The [HRCMS backend](https://github.com/QHao2508/HRCMS) running locally on `http://localhost:5299`, or a deployed API

### Run locally

```bash
git clone https://github.com/QHao2508/HRCMS-Frontend.git
cd HRCMS-Frontend
npm ci
cp .env.example .env.local     # optional: adjust the settings below
npm run dev                    # http://localhost:5173
```

In development, Vite proxies `/api`, `/health`, `/openapi` and the SignalR `/hubs` endpoint to the backend, so no CORS setup is needed.

## ⚙️ Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend origin used by the built app (no trailing `/api`). Leave empty locally to use the Vite proxy. | *(empty)* |
| `API_PROXY_TARGET` | Backend address for the dev proxy (server-side only, never exposed to the browser). | `http://localhost:5299` |
| `VITE_REALTIME_ENABLED` | Turns on the SignalR connection once the backend has realtime enabled. | `false` |

No secrets belong in this repository — the client only ever receives user tokens at runtime.

## ✅ Quality checks

```bash
npm run lint      # ESLint
npm test          # unit tests with the Node.js test runner
npm run build     # production build into dist/
```

Every push to a non-`main` branch and every pull request runs lint and tests in **Frontend CI**. Pushing to `main` runs the tests again before deploying.

## ☁️ Deployment

The app is deployed to **Azure Static Web Apps** by the `azure-static-web-apps.yml` workflow on every push to `main`:
<https://orange-ocean-04488bd00.1.azurestaticapps.net>

The backend API runs on Azure Container Apps with an auto-pausing Azure SQL database, so the first request after an idle period can take 30–60 seconds. Step-by-step guide: [docs/DEPLOY_AZURE.md](docs/DEPLOY_AZURE.md).

## 📚 Documentation

| Topic | Document |
| --- | --- |
| API integration & screen list | [API_INTEGRATION.md](docs/API_INTEGRATION.md) |
| Folder guide & function reference | [FOLDERS.md](docs/FOLDERS.md) · [FUNCTION_REFERENCE.md](docs/FUNCTION_REFERENCE.md) |
| Localization & message keys | [LOCALIZATION.md](docs/LOCALIZATION.md) |
| Theme & images | [THEME_AND_IMAGES_2026-10-28.md](docs/THEME_AND_IMAGES_2026-10-28.md) |
| Deployment | [DEPLOY_AZURE.md](docs/DEPLOY_AZURE.md) |
| Backend architecture & API contract | [HRCMS docs](https://github.com/QHao2508/HRCMS/tree/main/docs) |

## 👨‍💻 Team

**Team 2 — SWP391, Fall 2026** · Lecturer: NhanDT35

| Member | Student ID | Role | Frontend contributions |
| --- | --- | --- | --- |
| **Lê Quốc Hào** | SE170061 | Team leader | Workspace shell & UI redesign, care / stock / stable / reports screens, notifications, Azure deployment |
| **Trương Quang Gia Bảo** | SE171899 | Frontend developer · Tester | Authentication, horse registration & review, horse list & profile, training templates / plans / evaluation |
| **Trần Nguyễn Anh Khoa** | SE193316 | Backend developer | Manager screens, home page, training forms, veterinary workspace & incident photos |
| **Lê Gia Lạc** | SE180759 | Frontend developer · Tester | Initial React setup & routing, OTP authentication, training flow, medical flow |
| **Hoàng Tiến Đức** | SE170405 | Backend developer | Backend work — see the [HRCMS repository](https://github.com/QHao2508/HRCMS) |

---

<div align="center">
<sub>Built for the SWP391 course at FPT University. © 2026 Team 2 — HRCMS.</sub>
</div>
