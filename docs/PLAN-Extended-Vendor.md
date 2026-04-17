# Real-Data Execution Plan for Milkman

## Summary

Replace the current demo-driven app behavior with **database-backed operational data** while preserving the existing UI structure and admin workflows. The system will use MongoDB as the source of truth for customers, delivery status, billing, calendars, area analytics, products, vendors, and purchases.




This rollout will use **repeatable demo seeding** as the initial dataset:
- around 40 seeded customers
- seeded areas, products, vendors
- seeded delivery, payment, and purchase history
- dashboards/reports/calendars derived only from DB records

The chosen defaults are:
- **Seed Demo Data**
- **Daily Override** for extra milk
- **Simple Purchase Ledger** for vendor management

## Key Changes

### 1. Move the app from demo data to DB-backed reads
- Replace all `demo-data.ts` usage in admin/customer screens with server-side DB queries or service-layer fetchers.
- Keep the existing UI routes, but change their data source so:
  - dashboard KPIs
  - customer list/detail
  - billing summaries
  - reports
  - admin/customer calendars
  all derive from MongoDB.
- Introduce a small service layer so the same aggregation logic feeds dashboard, reports, and calendar without duplicated math.

### 2. Expand the domain model without breaking existing records
- Keep existing collections such as `User`, `CustomerProfile`, `MilkPlan`, `Delivery`, `Payment`, `BillSummary`, and `Area`.
- Add additive schema changes so existing structure is preserved:
  - `Delivery` gains support for:
    - `baseQuantity`
    - `extraQuantity`
    - `finalQuantity`
    - optional billable line items for ad hoc products
  - `CustomerProfile` remains linked to `Area` by `areaCode` and `areaName`
- Add new collections:
  - `Product`
    - name, code, category, unit, defaultRate, active status
    - supports milk and ad hoc dairy items like ghee and lassi
  - `Vendor`
    - name, phone, area, notes, active status
  - `PurchaseEntry`
    - vendor, date, product, quantity, rate, total amount, payment status, note
- Use `Product.category` to separate analytics:
  - milk liters count toward consumption analytics
  - ghee/lassi/etc count toward customer billing and product sales, but not milk-consumption liters unless explicitly categorized as milk

### 3. Daily delivery and extra-milk workflow
- Super Admin daily workflow becomes DB-backed:
  - view today’s customers
  - mark `DELIVERED`, `SKIPPED`, `PAUSED`
  - record final delivered milk quantity
  - add one-time extra milk for that day
  - add ad hoc products for that day
- Daily override model:
  - regular quantity comes from active `MilkPlan`
  - admin may add `extraQuantity` for that specific date
  - billable milk for that day = regular quantity + extra quantity if delivered
- Ad hoc products such as ghee/lassi are added as same-day billable line items and appear in billing history.

### 4. Billing, analytics, and calendars from real records
- Billing and reporting logic should read from actual delivery and purchase records:
  - customer billed amount = sum of delivered milk + ad hoc product items
  - customer due = billed amount - payments received
  - area analytics = aggregated from customer and delivery records
  - admin dashboard totals = derived from real statuses and transactions
- Admin calendar:
  - total daily milk consumption
  - delivered/skipped/paused counts
  - peak-day insights
  - area-wise breakdown from delivery records
- Customer calendar:
  - actual delivered milk per day
  - paused/skipped days
  - monthly estimated/actual bill from real line items
- Vendor cycle analytics:
  - daily purchase totals
  - vendor-wise purchase history
  - simple inbound visibility for milk sourcing
  - no full stock-layer accounting in this phase

### 5. New admin interfaces and navigation
- Add sidebar entries and DB-backed CRUD pages for:
  - `Products`
  - `Vendors`
  - `Purchases` or `Purchase Ledger`
- Existing `Areas` CRUD remains and becomes part of the same real-data admin setup.
- Customer management screens gain DB-backed forms and listing behavior.
- Admin product flow should allow:
  - create/edit/deactivate products
  - maintain rate list
- Vendor flow should allow:
  - create/edit/deactivate vendors
  - view vendor purchase history
- Purchase flow should allow:
  - add daily purchase entries
  - select vendor and product
  - store quantity, rate, amount, and status

### 6. Seed and migration strategy
- Extend the current seed script into a repeatable demo seed that creates:
  - 5 areas
  - around 40 customers distributed across those areas
  - active milk plans
  - delivery history for a recent date range
  - payment history
  - product master including milk, ghee, lassi, and similar items
  - vendor master
  - purchase entries for recent days
- Seed must be idempotent so repeated runs do not create duplicates.
- Existing hardcoded demo UI data should be retired only after DB-backed read paths are in place.

## Important Interface / API Changes

- New collections:
  - `Product`
  - `Vendor`
  - `PurchaseEntry`
- Expanded `Delivery` document to support daily overrides and optional non-milk billable items.
- New admin CRUD/API surfaces are expected for:
  - `/api/customers`
  - `/api/deliveries`
  - `/api/payments`
  - `/api/products`
  - `/api/vendors`
  - `/api/purchases`
- New admin pages are expected for:
  - `/admin/products`
  - `/admin/vendors`
  - `/admin/purchases`
- Existing calendars, reports, and dashboard pages should stop reading local mock arrays and instead use DB aggregation helpers.

## Test Plan

- Seed run creates areas, products, vendors, ~40 customers, plans, deliveries, payments, and purchases without duplicates.
- Customer counts and area analytics match seeded DB records.
- Dashboard, reports, billing, and calendars all show aligned numbers from the same DB state.
- Marking a customer delivered updates:
  - daily delivery status
  - delivered quantity
  - dashboard delivered counts
  - calendar totals
- Adding extra milk for one day increases:
  - that day’s customer bill
  - milk consumption analytics
  - customer calendar liters
- Adding ghee/lassi for one day increases:
  - customer bill
  - product sales totals
  - but does not inflate milk-liter analytics
- Vendor purchase entry appears in vendor history and purchase ledger totals.
- Area-linked customer deletion/edit constraints continue to work.
- `lint` and `build` pass after each implementation phase.

## Assumptions

- Demo seeding is the preferred way to populate the initial ~40 customers.
- Extra milk is modeled as a **daily override**, not a temporary plan change or customer-request workflow.
- Vendor management is a **simple purchase ledger**, not full inventory and COGS accounting.
- Products like ghee and lassi are **ad hoc sale items** added by admin, not customer self-order requests in this phase.
- “Real data from database” means all analytics and operational screens should derive from MongoDB, not from local demo arrays.
