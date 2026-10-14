# WholesaleHub Ethiopia — Database Architecture, Schema & ERD

## 1. Overview

WholesaleHub Ethiopia uses PostgreSQL with Prisma ORM. The schema is engineered for enterprise B2B wholesale trade with:
- Multi-tenant tenant scoping and role-based permissions.
- Concurrency-safe inventory reservations.
- Quantity-based tiered pricing with explicit wholesale units (cartons, boxes, kg, liters, etc.).
- Formal Request For Quotation (RFQ) negotiation cycles with immutable revision logs.
- Immutable purchase order snapshots protecting historical records against future catalog edits.
- Financial integrity using `Decimal(12, 2)` for monetary values (ETB) and `Decimal(5, 4)` for commission rates.

---

## 2. Detailed Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Session : "has active sessions"
    User ||--o{ BusinessMembership : "belongs to"
    User ||--o{ Address : "maintains"
    User ||--o| Cart : "owns"
    User ||--o{ Favorite : "saves"
    User ||--o{ Notification : "receives"
    User ||--o{ Review : "writes"
    User ||--o{ Dispute : "initiates"

    Business ||--o{ BusinessMembership : "has members"
    Business ||--o| SupplierProfile : "has supplier profile"
    Business ||--o{ Address : "maintains locations"
    Business ||--o{ Product : "supplies"
    Business ||--o{ Order : "places as buyer"
    Business ||--o{ Order : "fulfills as supplier"
    Business ||--o{ QuotationRequest : "requests as buyer"
    Business ||--o{ QuotationRequest : "receives as supplier"
    Business ||--o{ Conversation : "participates in"

    SupplierProfile ||--o{ SupplierVerificationDocument : "submits"
    SupplierProfile ||--o{ SupplierSettlement : "settles"

    Category ||--o{ Category : "subcategories"
    Category ||--o{ Product : "classifies"
    Category ||--o{ CommissionRule : "applies to"

    Product ||--o{ ProductImage : "displays"
    Product ||--o| Inventory : "manages stock"
    Product ||--o{ PriceTier : "tiered pricing"
    Product ||--o{ CartItem : "in cart"
    Product ||--o{ OrderItem : "ordered"
    Product ||--o{ Review : "reviews"
    Product ||--o{ Favorite : "favorited"

    Cart ||--o{ CartItem : "contains"

    Order ||--o{ OrderItem : "contains"
    Order ||--o{ OrderStatusHistory : "audit timeline"
    Order ||--o{ Payment : "settled by"
    Order ||--o| Invoice : "generates"
    Order ||--o| Shipment : "dispatches"
    Order ||--o| Conversation : "discusses"
    Order ||--o| Review : "reviews"
    Order ||--o| SupplierSettlement : "settlement"
    Order ||--o{ Dispute : "disputes"

    QuotationRequest ||--o{ Quotation : "quotes"
    QuotationRequest ||--o{ QuotationRevision : "revision history"
    QuotationRequest ||--o| Conversation : "negotiation chat"

    Quotation ||--o{ QuotationItem : "items"

    Payment ||--o{ PaymentEvent : "webhooks & audits"
    Conversation ||--o{ Message : "contains"

    PlatformSetting
    AuditLog
```

---

## 3. Core Database Models

| Model | Purpose | Key Constraints & Relations |
|---|---|---|
| `User` | User credentials, roles (`GUEST`, `BUYER`, `SUPPLIER`, `ADMIN`), and contact info. | Unique `email`, indexed `phone`, `role`. |
| `Session` | Rotating refresh token sessions for safe authentication. | Unique `refreshTokenHash`, cascade delete on user removal. |
| `Business` | Enterprise profiles for manufacturers, importers, wholesalers, retailers. | Unique `slug`, indexed `tinNumber`, `city`, `businessType`. |
| `BusinessMembership` | Team memberships within a business (`OWNER`, `MANAGER`, `MEMBER`). | Unique `[businessId, userId]`. |
| `SupplierProfile` | Supplier terms, verification status, and commission rates. | Unique `businessId`, indexed `verificationStatus`. |
| `SupplierVerificationDocument` | Private storage for business licenses, TIN certificates, and permits. | Foreign key to `SupplierProfile`, indexed `status`. |
| `Address` | Shipping, billing, warehouse, and office addresses in Ethiopia. | Indexed `city`, supports Addis Ababa sub-cities and woredas. |
| `Category` | Hierarchical catalog categories editable by administrators. | Unique `slug`, self-referential `parentId`. |
| `Product` | Wholesale product catalog items with MOQ, unit, and lead time. | Unique `slug`, indexed `sku`, `categoryId`, `businessId`. |
| `ProductImage` | Multi-image support with sort order and primary image flag. | Cascade delete on product removal. |
| `Inventory` | Available and reserved stock for concurrency-safe checkouts. | Unique `productId`, indexed `lowStockAlert`. |
| `PriceTier` | Quantity-based price discounts (e.g., 10–49 @ 1,400 ETB, 50+ @ 1,300 ETB). | Unique `[productId, minQuantity]`. |
| `Cart` & `CartItem` | Persistent shopping carts for authenticated buyers. | Unique `userId`, unique `[cartId, productId]`. |
| `Order` | Supplier-specific wholesale orders with totals and delivery terms. | Unique `orderNumber`, indexed `status`, `buyerBusinessId`, `supplierBusinessId`. |
| `OrderItem` | Historical snapshot of product name, SKU, unit price, quantity, and unit. | Indexed `orderId`, protects against catalog modifications. |
| `OrderStatusHistory` | Complete audit trail of order lifecycle state changes. | Tracks `changedById`, previous/new status, and timestamps. |
| `QuotationRequest` | Formal RFQ submitted by bulk buyers with target price and deadline. | Unique `rfqNumber`, indexed `status`, `expiresAt`. |
| `Quotation` & `QuotationItem` | Supplier responses with custom unit prices, lead times, and terms. | Versioned quotation records. |
| `QuotationRevision` | Immutable audit trail of RFQ negotiations and counteroffers. | Stores JSON snapshots of agreed commercial terms. |
| `Payment` | Records transactions via Telebirr, CBE Birr, bank transfer, or COD. | Unique `paymentNumber`, indexed `transactionReference`. |
| `PaymentEvent` | Audit log of webhook callbacks and manual payment verification steps. | Cascade delete on payment removal. |
| `Invoice` | Official commercial invoice records with tax and line-item breakdown. | Unique `invoiceNumber`, unique `orderId`. |
| `Shipment` | Delivery tracking, carrier details, driver contact, and dispatch status. | Unique `shipmentNumber`, unique `orderId`. |
| `Conversation` & `Message` | Secure buyer-supplier communication scoped to orders and RFQs. | Authorization checked against business membership. |
| `Notification` | System notifications for status updates and messages. | Indexed `userId`, `isRead`. |
| `Review` | 1–5 star reviews verified against completed orders. | Unique `orderId` (one review per verified purchase). |
| `Dispute` | Formal complaint mechanism for damaged goods or missed delivery. | Unique `disputeNumber`, indexed `status`. |
| `CommissionRule` | Configurable platform commission rates by category or global default. | Indexed `isActive`, `categoryId`. |
| `SupplierSettlement` | Computes gross sales, platform commissions, and net supplier payouts. | Unique `settlementNumber`, unique `orderId`. |
| `AuditLog` | Tamper-evident log of administrative approvals, edits, and actions. | Indexed `userId`, `action`, `createdAt`. |
| `PlatformSetting` | Global system configurations (currency, default shipping, contact info). | Unique `key`. |

---

## 4. Initial Seed Data (Development & Staging)

The development seed (`backend/prisma/seed.ts`) provides:

1. **10 Configurable Product Categories:**
   - Food & Beverages (`food-and-beverages`)
   - Clothing & Textiles (`clothing-and-textiles`)
   - Electronics & Accessories (`electronics-and-accessories`)
   - Computers & Office Equipment (`computers-and-office`)
   - Home & Kitchen (`home-and-kitchen`)
   - Construction Materials (`construction-materials`)
   - Industrial Supplies (`industrial-supplies`)
   - Beauty & Personal Care (`beauty-and-personal-care`)
   - Agriculture & Farming (`agriculture-and-farming`)
   - Packaging & Cleaning Supplies (`packaging-and-cleaning`)

2. **Platform Settings:**
   - Default Currency: `ETB`
   - Operational Timezone: `Africa/Addis_Ababa`
   - Default Platform Commission: `5%`
   - Platform Support Contact: `+251 11 661 2345`

3. **Development Test Accounts (Password: `WholesaleHub2026!`):**
   - **Administrator:** `dev-admin@wholesalehub.et`
   - **Verified Supplier:** `dev-supplier@wholesalehub.et` (Abyssinia Agro & Food Processing PLC, Akaki Kality Industrial Zone)
   - **Buyer:** `dev-buyer@wholesalehub.et` (Merkato Retailers Cooperative, Addis Ketema)
   - **Pending Supplier:** `dev-pending@wholesalehub.et` (Bole Electronics & Appliance Importers)

4. **Wholesale Sample Products with Quantity Tiers & Inventory:**
   - Ethiopian Yirgacheffe Grade 1 Green Coffee (Carton of 12 x 1kg; MOQ: 5; Stock: 250; 5-19 @ 2,800 ETB, 20-49 @ 2,650 ETB, 50+ @ 2,500 ETB).
   - Fortified Pure Sunflower Cooking Oil 20L (MOQ: 10; Stock: 600; 10-49 @ 3,200 ETB, 50-99 @ 3,050 ETB, 100+ @ 2,900 ETB).
   - Traditional Handwoven Ethiopian Cotton Gabi & Netela (Box of 10 Sets; MOQ: 2; Stock: 85; 2-9 @ 12,000 ETB, 10-24 @ 11,200 ETB, 25+ @ 10,500 ETB).

---

## 5. Migration & Deployment Commands (Windows PowerShell)

```powershell
# Navigate to backend
cd backend

# Configure your database connection in backend/.env:
# DATABASE_URL="postgresql://username:password@localhost:5432/wholesalehub_dev?schema=public"

# Deploy initial migration
npx prisma migrate deploy

# Run development seed
npm run seed
```
