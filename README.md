# Care Compliance System 🏥✨

An enterprise-grade, monorepo healthcare compliance and care home management platform built with **Next.js 16 (App Router)**, **NestJS 11**, **Prisma ORM**, **PostgreSQL**, **Redis**, and **AI Copilot (Gemini)**.

Specially engineered for UK Care Homes, Domiciliary Care Agencies, and Healthcare Providers to achieve and maintain **CQC (Care Quality Commission) Regulation 18 (Staffing & Competency)** and **Regulation 17 (Good Governance)** compliance readiness.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features & Workflows](#key-features--workflows)
  - [1. Multi-Role Portals (RBAC)](#1-multi-role-portals-rbac)
  - [2. Bedside Competency Auditor & Sign-Off Workflow](#2-bedside-competency-auditor--sign-off-workflow)
  - [3. E-Learning & Certificate Synchronization](#3-e-learning--certificate-synchronization)
  - [4. AI Copilot Compliance Auditor](#4-ai-copilot-compliance-auditor)
  - [5. Automated Expiry Alerts & Real-Time In-App Messaging](#5-automated-expiry-alerts--real-time-in-app-messaging)
  - [6. CQC Inspection Pack & Regulatory Reporting](#6-cqc-inspection-pack--regulatory-reporting)
- [Pre-configured Test Credentials](#pre-configured-test-credentials)
- [Tech Stack](#tech-stack)
- [Workspace & Monorepo Structure](#workspace--monorepo-structure)
- [Database Schema & Models](#database-schema--models)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker (Recommended)](#quick-start-with-docker-recommended)
- [Local Development Setup](#local-development-setup)
  - [1. Install Dependencies](#1-install-dependencies)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Database Migration & Seeding](#3-database-migration--seeding)
  - [4. Start Development Servers](#4-start-development-servers)
- [API Documentation (Swagger)](#api-documentation-swagger)
- [Scripts Reference](#scripts-reference)
- [License](#license)

---

## 🌟 Overview

The **Care Compliance System** solves critical compliance bottlenecks in social and residential care:
1. **Eliminating Paper-based Checklists**: Transitioning clinical competency audits to real-time digital evaluations with verified digital signatures.
2. **Real-time Synchronization**: Linking caregiver self-learning, certificate uploads, and practical bedside observations directly to organizational compliance metrics.
3. **Audit Trail & Governance**: Providing immutable logs, CQC inspection-ready summaries, and AI-assisted risk forecasting for regulatory inspections.

---

## 🚀 Key Features & Workflows

### 1. Multi-Role Portals (RBAC)
- **Admin Portal (`ADMIN`)**:
  - Global overview of all registered healthcare organizations.
  - Multi-tenant organization drilldown (`/dashboard/organizations/[id]`) showing real manager assignments, caregiver counts, compliance scores, bed capacities, and CQC ratings.
  - Organization user management and role delegation.
- **Registered Manager Portal (`MANAGER`)**:
  - Centralized command center for staff records, training matrix, and certificate renewals.
  - Dedicated **Bedside Competency Auditor** (`/dashboard/competencies`) with pending request spotlight banners.
  - Issue formal compliance warnings with custom action deadlines.
  - 1-Click CQC Inspection Pack exporter.
- **Caregiver Staff Portal (`STAFF`)**:
  - Real-time personal compliance health score.
  - Digital practical competency cards with assessor signatures and status badges (`PASS`, `FAIL`, `PENDING`).
  - Self-service **Request Bedside Audit** flow directly from the staff dashboard.

---

### 2. Bedside Competency Auditor & Sign-Off Workflow
Full bidirectional workflow supporting CQC Regulation 18 observation protocols:

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Caregiver (Staff)
    participant Backend as NestJS API & DB
    actor Manager as Registered Manager

    Staff->>Backend: Request Bedside Audit (selects competency, shift, notes)
    Backend->>Backend: Create/Update Competency record (level: PENDING)
    Backend->>Manager: In-App Notification ("Bedside Audit Request: {Competency}")
    Note over Manager: Manager sees request spotlight banner on /dashboard/competencies
    Manager->>Backend: Conduct Audit (checks tasks, enters clinical notes, signs on Canvas Pad)
    Backend->>Backend: Update Competency (level: PASS/FAIL, hand signature, timestamp)
    Backend->>Staff: In-App Notification ("Bedside Audit Completed: {Result}")
    Note over Staff: Staff dashboard updates score & shows verified digital signature
```

- **Supported Standard Clinical Competencies**:
  - **Hoist Safety**: Pre-use check, sling selection, transfer protocols.
  - **Medication Administration**: 5 Rights verification, MAR chart validation, controlled drugs safety.
  - **Infection Prevention & Control (IPC)**: 7-step hand hygiene, PPE donning/doffing order, waste management.
  - **First Aid / Basic Life Support (BLS)**: ABCDE survey, 30:2 CPR, AED deployment.
  - **Fire Evacuation**: PEEP protocols, evacuation routes, fire door operation.
  - **Wound Care**: Aseptic technique, dressing selection, deterioration escalation.
- **HTML5 Canvas Digital Signature Pad**: Enables assessors to capture smooth ink hand signatures on mobile or desktop devices.
- **Thumbnail Image Preview**: Safely renders signatures across both staff and organization portals without text overflow.

---

### 3. E-Learning & Certificate Synchronization
- Caregivers upload completion certificates or e-learning records.
- System automatically links completed certificates to the staff training record.
- Completed e-learning modules immediately update dashboard stats (`Completed E-Learning: N`), eliminating 0-count discrepancies.

---

### 4. AI Copilot Compliance Auditor
- Powered by **Google Gemini API**.
- **Compliance Risk Forecasting**: Analyzes overdue training courses, expired certificates, and upcoming shift requirements to predict compliance risk scores.
- **Interactive Auditor Assistant**: Natural language queries regarding CQC regulations, required staff-to-resident ratios, and inspection preparedness.

---

### 5. Automated Expiry Alerts & Real-Time In-App Messaging
- **Automated Cron Jobs** (`@nestjs/schedule`) scan daily for:
  - Expiring certificates (30-day, 14-day, and 7-day warnings).
  - Lapsed mandatory trainings.
- **Notification Center**: Real-time notification drawer with unread count badges and direct navigation to affected records.

---

### 6. CQC Inspection Pack & Regulatory Reporting
- Instant generation of CQC evidence packs.
- Matrix exports showing training coverage across all mandatory care standards.
- Detailed audit logs capturing all user actions, timestamps, and IP addresses.

---

## 🔑 Pre-configured Test Credentials

The database comes pre-seeded with real multi-tenant organizations and accounts for testing:

| Role | Name | Email | Password | Purpose / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | Administrator | `admin@carecompliance.com` | `Admin123!` | Full multi-tenant control, organization oversight |
| **Registered Manager** | Muhammad Mohsin Zafar | `whoopitintern099@gmail.com` | `Password123!` | Registered Manager of Sunrise Senior Living |
| **Care Assistant (Staff)** | Abdul Rafeh | `mohsinz35425@gmail.com` | `Password123!` | Care Assistant under Sunrise Senior Living |

---

## 🛠️ Tech Stack

### Monorepo Architecture
- **Workspace Manager**: [pnpm](https://pnpm.io/) workspaces
- **Docker Orchestration**: Docker Compose with multi-stage production builds

### Frontend (`apps/frontend`)
- **Framework**: Next.js 16.2 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React icons, Next Themes
- **State & Caching**: TanStack React Query v5, Axios
- **Form Management**: React Hook Form, Zod validation
- **Feedback & UI**: Sonner toasts, HTML5 Canvas Signature Pad

### Backend (`apps/backend`)
- **Framework**: NestJS v11 (TypeScript)
- **Database**: PostgreSQL 15+ via Prisma ORM v7 with `@prisma/adapter-pg`
- **Cache & Queue**: Redis 7+
- **Auth & Security**: Passport-JWT, Argon2, Helmet, `@nestjs/throttler`
- **Email & Schedule**: `@nestjs-modules/mailer`, Nodemailer, `@nestjs/schedule`
- **Documentation**: Swagger / OpenAPI (`@nestjs/swagger`)
- **AI Integration**: Google Gemini API (`@google/genai`)

---

## 🏗️ Workspace & Monorepo Structure

```
care-compliance-system/
├── apps/
│   ├── backend/                      # NestJS 11 REST API Application
│   │   ├── prisma/                   # Prisma Schema & Database Seeds
│   │   │   ├── schema.prisma         # Multi-tenant PostgreSQL models
│   │   │   └── seed.ts               # Demo data seeder
│   │   ├── src/
│   │   │   ├── common/               # Filters, Interceptors, Guards, Decorators
│   │   │   ├── config/               # Zod environment schemas
│   │   │   ├── database/             # Prisma service provider
│   │   │   └── modules/              # Core Domain Modules
│   │   │       ├── auth/             # JWT, Login, Refresh, Password Reset
│   │   │       ├── staff/            # Employee profiles & directories
│   │   │       ├── organizations/    # Care Home & Organization tenancy
│   │   │       ├── competencies/     # Bedside Audits & Request endpoints
│   │   │       ├── training/         # Training records & matrix
│   │   │       ├── certificates/     # Certificate upload & sync
│   │   │       ├── notifications/    # In-app alert dispatch
│   │   │       ├── messages/         # Direct manager-staff communication
│   │   │       ├── copilot/          # AI Risk forecasting & Gemini chat
│   │   │       └── audit-logs/       # Immutable regulatory audit trails
│   │   └── package.json
│   │
│   └── frontend/                     # Next.js 16 App Router Application
│       ├── app/                      # Next.js Page Routes
│       │   ├── (auth)/               # Login, Register, Forgot Password
│       │   └── dashboard/            # Role-aware dashboard views
│       │       ├── certificates/     # Certificate repository
│       │       ├── competencies/     # Bedside Competency Auditor
│       │       ├── messages/         # Staff/Manager inbox
│       │       ├── organizations/    # Admin org directory & detail views
│       │       ├── reports/          # Compliance analytics & exports
│       │       ├── staff/            # Care team directory
│       │       └── training-matrix/  # Organization-wide training grid
│       ├── components/               # Reusable UI & Layout Components
│       ├── services/                 # Typed Axios API Client services
│       ├── context/                  # AuthContext and state providers
│       └── package.json
│
├── infrastructure/                   # Dockerfiles
│   └── docker/
│       ├── backend.Dockerfile
│       ├── frontend.Dockerfile
│       ├── postgres.Dockerfile
│       └── redis.Dockerfile
│
├── docker-compose.yml                # Full-stack Docker orchestration
├── pnpm-workspace.yaml               # Monorepo configuration
├── .gitignore                        # Global gitignore (node_modules, .next, .pnpm-store, dist)
└── README.md                         # Project documentation
```

---

## 🗄️ Database Schema & Models

| Model | Purpose |
| :--- | :--- |
| **`User`** | Credentials, role (`ADMIN`, `MANAGER`, `STAFF`), status (`ACTIVE`, `PENDING`), hashed tokens, OTP reset data. |
| **`Staff`** | Clinical profile linked 1:1 with User, employee number, department, job title, contact details. |
| **`Organization`** | Tenant care provider, CQC rating, bed capacity, registration number, subscription tier. |
| **`Competency`** | Bedside audit record, level (`PENDING`, `PASS`, `FAIL`), clinical checklist, assessor notes, digital signature. |
| **`Training`** | Course completion log, validity dates, training provider, certificate linkages. |
| **`Certificate`** | Uploaded accreditation files, issuing body, verification status (`VALID`, `EXPIRING`, `EXPIRED`). |
| **`Notification`** | Real-time in-app alerts, type (`INFO`, `WARNING`, `SUCCESS`, `ERROR`), read receipts. |
| **`Message`** | Internal threaded messages between managers and staff members. |
| **`AuditLog`** | CQC-compliant audit records detailing user actions, entity mutations, IP addresses, and user agents. |

---

## ⚙️ Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **pnpm**: `v10.x` or `v11.x` (`npm install -g pnpm`)
- **Docker & Docker Compose** (for containerized execution)
- **PostgreSQL 15+** & **Redis 7+** (if running without Docker)

---

## 🐳 Quick Start with Docker (Recommended)

The easiest way to start the entire system (Database, Redis, API, and Web App) is with Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd care-compliance-system

# Build and start all 4 containers in the background
docker compose up --build -d
```

### Running Services:
- **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:3001](http://localhost:3001)
- **Swagger Documentation**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **PostgreSQL**: `localhost:5432` (`user: postgres`, `password: postgres`, `db: care_compliance`)
- **Redis Cache**: `localhost:6379`

To view container logs or restart services:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose restart
```

---

## 💻 Local Development Setup

If you prefer running services directly on your host machine:

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Variables

#### Backend (`apps/backend/.env`):
```env
PORT=3001
NODE_ENV=development
API_PREFIX=api/v1
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/care_compliance?schema=public"

JWT_ACCESS_SECRET=your-super-secret-access-token-key-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

REDIS_HOST=localhost
REDIS_PORT=6379

# Google Gemini Copilot (Optional)
GEMINI_API_KEY=your_google_gemini_api_key

# Mailer (Optional)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_user
MAIL_PASS=your_pass
MAIL_FROM="Care Compliance <noreply@carecompliance.com>"
```

#### Frontend (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_ENV=development
PORT=3000
```

### 3. Database Migration & Seeding
```bash
# Push schema to PostgreSQL database
cd apps/backend
npx prisma db push

# Seed database with demo accounts and organizations
npx prisma db seed
cd ../..
```

### 4. Start Development Servers
```bash
# Run both Backend & Frontend concurrently
pnpm dev

# Or run separately:
pnpm dev:backend   # NestJS API at http://localhost:3001
pnpm dev:frontend  # Next.js at http://localhost:3000
```

---

## 📖 API Documentation (Swagger)

Interactive Swagger / OpenAPI 3.0 documentation is automatically served by NestJS at:

👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

Includes full request/response schemas, JWT bearer authorization, and try-it-out functionality for:
- `POST /api/v1/auth/login`
- `POST /api/v1/competencies/request-audit`
- `POST /api/v1/competencies`
- `GET /api/v1/notifications`
- `GET /api/v1/training/matrix`
- `POST /api/v1/copilot/chat`

---

## 📜 Scripts Reference

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Concurrently runs both frontend and backend development servers |
| `pnpm dev:backend` | Starts the NestJS API in watch mode (`pnpm --filter backend start:dev`) |
| `pnpm dev:frontend` | Starts the Next.js development server (`pnpm --filter frontend dev`) |
| `pnpm build` | Compiles both backend and frontend applications |
| `pnpm lint` | Runs ESLint checks across all workspace packages |

---

## 📄 License

This software is proprietary and confidential. All rights reserved.
