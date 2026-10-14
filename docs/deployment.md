# WholesaleHub Ethiopia — Deployment Guide

## 1. Target Hosting Architecture

- **Frontend:** Vercel (Next.js 15 App Router)
- **Backend API:** Managed Node.js service (Render, Railway, Fly.io, or AWS ECS)
- **Database:** Managed PostgreSQL (Neon, Supabase, or AWS RDS)

## 2. Environment Variables Checklist

### Frontend (.env.production)
- `NEXT_PUBLIC_API_URL`: Fully qualified HTTPS backend URL (e.g., `https://api.wholesalehub.et/api/v1`)
- `NEXT_PUBLIC_APP_NAME`: `WholesaleHub Ethiopia`
- `NEXT_PUBLIC_DEFAULT_LOCALE`: `en`
- `NEXT_PUBLIC_DEFAULT_CURRENCY`: `ETB`

### Backend (.env.production)
- `NODE_ENV`: `production`
- `PORT`: Service port (typically assigned by host, e.g., `5000` or `8080`)
- `API_PREFIX`: `/api/v1`
- `CORS_ORIGIN`: Whitelisted production frontend domain(s)
- `DATABASE_URL`: Connection string with SSL enabled
- `JWT_ACCESS_SECRET`: 64+ char random hexadecimal/base64 string
- `JWT_REFRESH_SECRET`: 64+ char random hexadecimal/base64 string
- `DEFAULT_CURRENCY`: `ETB`
- `DEFAULT_TIMEZONE`: `Africa/Addis_Ababa`

## 3. Migration and Deployment Order

1. Provision PostgreSQL database on Neon.
2. Deploy backend service with required environment variables.
3. Run Prisma migration deployment: `npx prisma migrate deploy`.
4. Run health check smoke test: `curl -I https://api.wholesalehub.et/api/v1/health`.
5. Deploy frontend on Vercel with `NEXT_PUBLIC_API_URL` pointing to backend.
6. Verify live health indicator and core marketplace pages.
