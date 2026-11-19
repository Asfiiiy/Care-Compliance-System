# Care Compliance System - Backend API 🏥⚙️

The NestJS 11 REST API service for the Care Compliance platform, built with TypeScript, Prisma ORM, PostgreSQL, Redis, and Google Gemini AI.

---

## 🚀 Features

- **JWT Authentication & RBAC**: Roles `ADMIN`, `MANAGER`, and `STAFF`.
- **Bedside Practical Competency Auditor**: Endpoints for audit requests (`POST /api/v1/competencies/request-audit`) and clinical sign-offs (`POST /api/v1/competencies`).
- **Real-time Notifications**: In-app notifications dispatched on certificate expiry and audit events.
- **AI Copilot**: Gemini-assisted compliance risk forecasting and interactive regulatory guidance.
- **Audit Logs**: Full audit trail recording user mutation actions.

---

## 🛠️ Quick Commands

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm prisma db push

# Seed initial data
pnpm prisma db seed

# Run in development watch mode
pnpm start:dev

# Build production bundle
pnpm build
```

---

## 📖 Swagger API Docs

When the server is running on port 3001, access the interactive OpenAPI documentation at:
**[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**
