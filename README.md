# WholesaleHub Ethiopia — B2B Wholesale Marketplace

Production-ready, secure, and responsive B2B wholesale marketplace connecting verified manufacturers, importers, distributors, wholesalers, and retail buyers in Ethiopia, starting with Addis Ababa.

---

## 1. System Architecture

- **Frontend (`frontend/`):** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, multilingual i18n support (English, Amharic, Afaan Oromo).
- **Backend (`backend/`):** Node.js 24, Express, TypeScript, Zod schema validation, Helmet, CORS, structured logging, centralized error handling.
- **Database (`backend/prisma/`):** PostgreSQL (Neon / Managed Postgres) with Prisma ORM.
- **Documentation (`docs/`):** System architecture, database ERD, API specification, security policies, and deployment guides.

---

## 2. Implementation Progress Checklist

- [x] **Stage 0:** Repository inspection, requirements alignment, and architectural foundation.
- [x] **Stage 1:** Frontend/backend setup, dependencies, environment validation, health endpoint, i18n localization, and documentation.
- [x] **Stage 2:** PostgreSQL, Prisma schema, migrations, initial ER diagram, and development seed.
- [ ] **Stage 3:** Authentication, sessions, roles, business profiles, and authorization tests.
- [ ] **Stage 4:** Public marketplace UI, navigation, categories, product discovery, and responsive design.
- [ ] **Stage 5:** Supplier onboarding, verification, product management, inventory, and tiered pricing.
- [ ] **Stage 6:** Search, filters, sorting, favorites, and supplier discovery.
- [ ] **Stage 7:** Cart, checkout, order creation, transactional stock management, and order history.
- [ ] **Stage 8:** Quotations, price negotiation, revisions, and accepted-quotation orders.
- [ ] **Stage 9:** Payments architecture, manual payment workflows, provider adapters, invoices, and commissions.
- [ ] **Stage 10:** Delivery management, messaging, and notifications.
- [ ] **Stage 11:** Reviews, complaints, disputes, and administrative moderation.
- [ ] **Stage 12:** Full administrator dashboard, audit logs, reporting, and settings.
- [ ] **Stage 13:** Security hardening, integration testing, end-to-end testing, and performance improvements.
- [ ] **Stage 14:** Production environment configuration, deployment, smoke tests, backup guidance, and final documentation.

---

## 3. Quick Start & Local Development (Windows PowerShell)

### Prerequisites
- Node.js >= 20 (Verified on v24.19.0)
- npm >= 10 (Verified on 11.17.0)

### Terminal 1 — Backend API
```powershell
# Navigate to backend
cd backend

# Setup environment
Copy-Item .env.example .env

# Install dependencies (if not already installed)
npm install

# Run automated tests
npm test

# Start development server
npm run dev
# The API will be available at http://localhost:5000/api/v1/health
```

### Terminal 2 — Frontend Application
```powershell
# Navigate to frontend
cd frontend

# Setup environment
Copy-Item .env.example .env.local

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
# The application will be accessible at http://localhost:3000
```

---

## 4. API Health Endpoint

- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/health`
- **Status:** `200 OK`
- **Response Structure:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "WholesaleHub Ethiopia API",
    "version": "1.0.0",
    "timestamp": "2026-10-14T03:50:00.000Z",
    "uptimeSeconds": 142,
    "environment": "development",
    "defaultCurrency": "ETB",
    "timezone": "Africa/Addis_Ababa"
  }
}
```

---

## 5. Documentation Links

- [System Architecture](file:///C:/Users/HP/Desktop/as/Wholesale-Marketplace/docs/architecture.md)
- [Database Architecture & ERD](file:///C:/Users/HP/Desktop/as/Wholesale-Marketplace/docs/database.md)
- [API Reference](file:///C:/Users/HP/Desktop/as/Wholesale-Marketplace/docs/api.md)
- [Security Guidelines](file:///C:/Users/HP/Desktop/as/Wholesale-Marketplace/docs/security.md)
- [Deployment Guide](file:///C:/Users/HP/Desktop/as/Wholesale-Marketplace/docs/deployment.md)