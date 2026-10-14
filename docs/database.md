# WholesaleHub Ethiopia — Database Architecture & ER Diagram

## 1. Overview

The platform uses PostgreSQL with Prisma ORM. The schema is designed for multi-tenant B2B wholesale trade, ensuring strict data isolation between suppliers, concurrency-safe inventory tracking, tiered wholesale pricing, auditable RFQ negotiation histories, and immutable purchase snapshots.

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Session : "has"
    User ||--o{ BusinessMembership : "belongs to"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "initiates"

    Business ||--o{ BusinessMembership : "has members"
    Business ||--o| SupplierProfile : "has profile"
    Business ||--o{ Address : "maintains"
    Business ||--o{ Product : "supplies"
    Business ||--o{ Order : "placed as buyer"
    Business ||--o{ Order : "fulfilled as supplier"
    Business ||--o{ QuotationRequest : "requests as buyer"
    Business ||--o{ QuotationRequest : "receives as supplier"

    SupplierProfile ||--o{ SupplierVerificationDocument : "submits"
    SupplierProfile ||--o{ SupplierSettlement : "settles"

    Category ||--o{ Category : "subcategories"
    Category ||--o{ Product : "classifies"

    Product ||--o{ ProductImage : "displays"
    Product ||--o| Inventory : "tracks stock"
    Product ||--o{ PriceTier : "defines wholesale prices"
    Product ||--o{ CartItem : "in cart"
    Product ||--o{ OrderItem : "ordered"
    Product ||--o{ Review : "reviewed"

    Cart ||--o{ CartItem : "contains"
    User ||--o| Cart : "owns"

    Order ||--o{ OrderItem : "contains"
    Order ||--o{ OrderStatusHistory : "transitions"
    Order ||--o{ Payment : "settled by"
    Order ||--o| Invoice : "billed as"
    Order ||--o| Shipment : "shipped as"

    QuotationRequest ||--o{ Quotation : "quotes"
    Quotation ||--o{ QuotationItem : "items"
    Quotation ||--o{ QuotationRevision : "history"
    Quotation ||--o| Order : "converted to"

    Conversation ||--o{ Message : "contains"
    Order ||--o| Conversation : "discusses"
    QuotationRequest ||--o| Conversation : "negotiates"

    CommissionRule ||--o{ SupplierSettlement : "calculates"
```

## 3. Core Models & Business Rules

1. **User & Business Membership:**
   - Supports role-based (`BUYER`, `SUPPLIER`, `ADMIN`) and resource-based authorization.
   - Separation of personal credentials (`User`) and enterprise entities (`Business`).

2. **Supplier Verification:**
   - Real administrative approval workflow (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`).
   - Private storage and strict access controls for business licenses and tax certificates.

3. **Catalog & Wholesale Tiered Pricing:**
   - Each product defines a minimum order quantity (MOQ) and unit (carton, kg, box, etc.).
   - `PriceTier` records tiered discounts (e.g., 10-49 units @ 1400 ETB, 50+ units @ 1300 ETB).
   - Quantity tiers validate server-side and calculate line totals deterministically.

4. **Cart & Multi-Supplier Checkout:**
   - Carts can hold items from multiple suppliers, but checkout splits orders per supplier.
   - Concurrency-safe inventory reservations ensure no overselling.

5. **Quotations & Price Negotiation:**
   - Formal Request For Quotation (RFQ) cycle with target prices, expiry deadlines, and revision trails.
   - Immutable terms upon acceptance prevent retroactive changes.

6. **Order Snapshotting:**
   - Confirmed orders snapshot product names, SKUs, units, and unit prices to insulate historic financial records from future catalog changes.
