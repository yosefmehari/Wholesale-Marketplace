# WholesaleHub Ethiopia — Security Architecture & Guidelines

## 1. Core Security Principles

1. **Defense in Depth:** Validation and authorization enforced strictly at the database and API controller levels, never relying purely on UI hiding.
2. **Least Privilege:** Separate database credentials, bounded role privileges (`GUEST`, `BUYER`, `SUPPLIER`, `ADMIN`), and resource-level isolation.
3. **Auditability:** Sensitive operations (supplier verifications, catalog suspensions, fee modifications, order cancellations) are recorded in `AuditLog`.

## 2. Protection Mechanisms

- **Input Validation:** Every incoming HTTP request validated using Zod schemas with sanitization.
- **SQL Injection Prevention:** Prisma ORM parameterizes all database queries. Raw queries are prohibited unless explicitly reviewed.
- **Security Headers:** Express app hardened via `helmet` (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
- **CORS Protection:** Configurable whitelist of frontend origins.
- **Password Hashing:** Argon2id / bcrypt with high iteration cost factors.
- **Session Protection:** Short-lived access tokens (15 minutes) paired with rotating refresh tokens stored in secure, HttpOnly cookies or encrypted storage.
- **Private Document Isolation:** Business licenses and tax identification documents are stored privately with authenticated proxy downloads.
- **Payment Safety:** No credit card numbers or CVVs stored. External provider signature verification (Telebirr/Bank Webhooks) protects against replay and tampering.
