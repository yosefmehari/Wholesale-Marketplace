# WholesaleHub Ethiopia — REST API Reference & Specification

## 1. Overview

- **Base URL:** `/api/v1`
- **Format:** JSON (`application/json`)
- **Authentication:** Bearer token (short-lived JWT access token + refresh session)

## 2. Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "details": { ... }
  }
}
```

## 3. Endpoints Matrix (Planned by Stage)

| Endpoint | Method | Role | Description | Stage |
|---|---|---|---|---|
| `/health` | GET | Public | Service health & environment status | Stage 1 |
| `/auth/register` | POST | Public | User registration | Stage 3 |
| `/auth/login` | POST | Public | User authentication & session | Stage 3 |
| `/auth/refresh` | POST | Authenticated | Token refresh | Stage 3 |
| `/auth/logout` | POST | Authenticated | Terminate session | Stage 3 |
| `/businesses/profile` | GET/POST | Buyer/Supplier | Business profile management | Stage 3 |
| `/suppliers/verification` | POST | Supplier | Submit verification documents | Stage 5 |
| `/admin/verifications` | GET/PATCH | Admin | Review & approve suppliers | Stage 5 |
| `/categories` | GET/POST | Public/Admin | Category discovery & management | Stage 4 |
| `/products` | GET/POST | Public/Supplier | Product catalog & tiered pricing | Stage 5 |
| `/products/:slug` | GET | Public | Product details & price tiers | Stage 5 |
| `/cart` | GET/POST/DELETE | Buyer | Cart management & validation | Stage 7 |
| `/checkout` | POST | Buyer | Concurrency-safe supplier split order | Stage 7 |
| `/orders` | GET/POST | Buyer/Supplier | Order lifecycle & tracking | Stage 7 |
| `/quotations` | GET/POST | Buyer/Supplier | RFQ negotiation & revisions | Stage 8 |
| `/payments/process` | POST | Buyer | Payment provider adapter / bank wire | Stage 9 |
| `/invoices/:orderId` | GET | Buyer/Supplier | Commercial invoice generation | Stage 9 |
