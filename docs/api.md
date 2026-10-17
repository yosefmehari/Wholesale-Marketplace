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
| `/favorites` | GET | Buyer | Get buyer's saved favorite products | Stage 6 |
| `/favorites/:productId` | POST/DELETE | Buyer | Add or remove product from favorites | Stage 6 |
| `/favorites/check/:productId` | GET | Buyer/Public | Check if product is favorited | Stage 6 |
| `/cart` | GET/DELETE | Buyer | Retrieve active cart or clear items | Stage 7 |
| `/cart/items` | POST | Buyer | Add wholesale product with MOQ & stock check | Stage 7 |
| `/cart/items/:itemId` | PATCH/DELETE | Buyer | Update item quantity or remove item | Stage 7 |
| `/orders/checkout` | POST | Buyer | Transactional multi-supplier split checkout & atomic stock deduction | Stage 7 |
| `/orders` | GET | Buyer | List buyer orders with status filtering & pagination | Stage 7 |
| `/orders/:id` | GET | Buyer/Supplier/Admin | Order details, snapshot, and status audit timeline | Stage 7 |
| `/orders/:id/cancel` | PATCH | Buyer/Supplier/Admin | Cancel order and atomically restore inventory stock | Stage 7 |
| `/orders/:id/status` | PATCH | Supplier/Admin | Advance fulfillment status with valid state transitions | Stage 7 |
| `/orders/supplier/list` | GET | Supplier | Orders received by supplier fulfillment center | Stage 7 |
| `/quotations/rfq` | POST | Buyer | Submit new RFQ with line items and delivery specs | Stage 8 |
| `/quotations/rfqs` | GET | Buyer/Supplier | List RFQs by role, status, and pagination | Stage 8 |
| `/quotations/rfqs/:id` | GET | Buyer/Supplier/Admin | Full RFQ details, proposal versions, and negotiation history | Stage 8 |
| `/quotations/rfqs/:id/quote` | POST | Supplier | Submit formal quotation version with offered unit rates | Stage 8 |
| `/quotations/rfqs/:id/request-revision` | POST | Buyer | Request counter-offer or terms revision | Stage 8 |
| `/quotations/rfqs/:id/decline` | POST | Buyer/Supplier | Decline quotation proposal | Stage 8 |
| `/quotations/rfqs/:id/accept` | POST | Buyer | Accept quotation and convert into binding purchase order | Stage 8 |
| `/payments/initiate` | POST | Buyer | Initiate order payment (Telebirr, CBE Birr, Bank Transfer) | Stage 9 |
| `/payments/submit-proof` | POST | Buyer | Submit bank wire deposit slip transaction reference | Stage 9 |
| `/payments/:id/verify` | POST | Supplier/Admin | Verify manual bank transfer or mobile payment | Stage 9 |
| `/payments/order/:orderId` | GET | Buyer/Supplier/Admin | Retrieve payment audit trail and status for an order | Stage 9 |
| `/payments/webhook/telebirr` | POST | Public (Webhook) | Telebirr asynchronous payment notification webhook | Stage 9 |
| `/invoices/:orderId` | GET | Buyer/Supplier/Admin | Generate formal B2B Ethiopian commercial sales invoice | Stage 9 |
| `/settlements` | GET | Supplier/Admin | Supplier settlements ledger, 3% commission, and payout balances | Stage 9 |
| `/settlements/:id/payout` | PATCH | Admin | Mark supplier settlement as paid out with payout reference | Stage 9 |
