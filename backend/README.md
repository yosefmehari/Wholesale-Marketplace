# WholesaleHub Ethiopia - Backend API

Production-ready B2B Wholesale Marketplace REST API built with Express, TypeScript, Zod, and PostgreSQL / Prisma.

## Requirements

- Node.js >= 20 (Verified on v24.19.0)
- npm >= 10 (Verified on 11.17.0)
- PostgreSQL database instance (Neon, Supabase, or local Postgres)

## Directory Structure

```
backend/
├── prisma/
│   └── schema.prisma         # Prisma schema and datasource
├── src/
│   ├── config/               # Environment variable validation (Zod)
│   ├── lib/                  # Utilities (structured logger, helpers)
│   ├── middleware/           # Error handling, request logging, security
│   ├── modules/              # Domain modules (health, auth, products, etc.)
│   ├── routes.ts             # API v1 Master Router
│   ├── app.ts                # Express app setup and middleware
│   └── server.ts             # Server entrypoint and graceful shutdown
├── tests/                    # Integration and unit tests (Vitest + Supertest)
├── .env.example              # Environment variables template
├── package.json
└── tsconfig.json
```

## Setup & Running (Windows PowerShell)

```powershell
# Navigate to backend (or run directly from root)
cd backend

# Copy environment template if not already present
Copy-Item .env.example .env

# Install dependencies
npm install

# Run automated tests
npm test

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Health Check

- **URL:** `GET http://localhost:5000/api/v1/health`
- **Response Format:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "WholesaleHub Ethiopia API",
    "version": "1.0.0",
    "timestamp": "2026-10-14T03:50:00.000Z",
    "uptimeSeconds": 12,
    "environment": "development",
    "defaultCurrency": "ETB",
    "timezone": "Africa/Addis_Ababa"
  }
}
```
