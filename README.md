# Milkman

Lightweight, mobile-friendly milk delivery management app built with Next.js and MongoDB for Indian milk sellers. read by mukesh one two three..

## Vision

`Milkman` is a bilingual (`English` + `Hindi`) admin-first web application for daily milk delivery operations.

The primary goal is to help a milk seller:

- manage customers
- track daily milk requirements
- mark daily deliveries
- maintain account balances and payments
- allow customers to view their own usage, bills, and status

The interface should feel simple on mobile, fast for daily operations, and practical enough to be used like a lightweight admin panel or mobile web app.

## Core User Roles

### 1. Super Admin
The owner/seller role. This user can:

- create and manage customers
- define daily milk quantities per customer
- update address and contact details
- mark deliveries as completed
- update pricing and payment entries
- view reports, dues, and delivery summaries
- manage bilingual labels/content preferences

### 2. Customer
A limited-access user who can:

- log in securely
- see their active milk plan/quantity
- view delivery history
- view monthly billing/account summary
- check pending dues and payments
- request/update profile details if allowed

## Product Goals

- lightweight and easy to maintain
- optimized for mobile-first admin usage
- responsive on desktop and tablet
- bilingual UI: Hindi and English
- INR currency formatting throughout
- clean and mature admin-panel style design
- simple CRUD flow with low operational friction

## Recommended Tech Stack

- `Next.js` (App Router)
- `TypeScript`
- `MongoDB` with `Mongoose`
- `NextAuth` or auth via secure session-based custom auth
- `Tailwind CSS`
- `shadcn/ui` or a very small custom component layer
- `next-intl` for Hindi/English localization
- `Zod` for validation

## Suggested Product Modules

### Admin Side

- Dashboard
- Customer Management
- Daily Delivery Marking
- Milk Plan/Subscription Management
- Billing & Payments
- Reports
- Settings

### Customer Side

- My Dashboard
- My Plan
- Delivery History
- Billing & Payments
- Profile

## Functional Scope

### Customer Management

- add customer
- edit customer
- activate/deactivate customer
- store name, phone, address, landmark, notes
- assign daily milk quantity
- support flexible quantities like `1L`, `2L`, `2.5L`, `custom`

### Delivery Tracking

- list today’s customers
- mark delivered / skipped / paused
- update delivery notes
- optionally support morning/evening in later phase

### Billing & Accounts

- price per liter
- customer-specific rate if needed
- payment entry with mode and note
- monthly due summary
- running balance in INR

### Customer Portal

- view plan
- view recent deliveries
- view monthly bill summary
- view payments and pending amount

## Proposed Information Architecture

- Admin routes mostly live under `/admin`
- Customer routes mostly live under `/customer`
- Public/auth routes remain minimal

Example route groups:

- `/login`
- `/admin/dashboard`
- `/admin/customers`
- `/admin/customers/[id]`
- `/admin/deliveries`
- `/admin/billing`
- `/admin/reports`
- `/customer/dashboard`
- `/customer/history`
- `/customer/billing`
- `/customer/profile`

## Data Model Overview

### User

- role: `SUPER_ADMIN | CUSTOMER`
- name
- phone
- email or mobile login identifier
- password hash / auth provider data
- preferred language
- status

### CustomerProfile

- linked user id
- customer code
- address
- area
- landmark
- notes
- active status

### MilkPlan

- customer id
- quantity liters
- unit label
- price per liter
- start date
- end date (optional)
- active flag

### Delivery

- customer id
- date
- quantity delivered
- status: `DELIVERED | SKIPPED | PAUSED`
- note
- marked by

### Payment

- customer id
- amount
- date
- mode: `CASH | UPI | BANK`
- note

### BillSummary

- customer id
- month
- total quantity
- total amount
- paid amount
- due amount

## UX Direction

- mobile-first layout
- sticky top bar for quick actions
- card-based dashboard
- large touch targets for delivery marking
- clean forms with Hindi + English labels where useful
- fast daily workflow with minimal steps

Design style should feel:

- mature
- utility-focused
- polished but lightweight
- not overly decorative

## Internationalization

- default languages: `en`, `hi`
- UI strings should be translation-driven
- currency display in `INR`
- date and number formatting localized for Indian usage

## Phase Plan

### Phase 1: Foundation

- Next.js app setup
- Tailwind setup
- MongoDB connection
- auth and role-based access
- i18n setup
- base layout and design system

### Phase 2: Core Admin

- admin dashboard
- customer CRUD
- milk plan management
- daily delivery marking

### Phase 3: Billing

- payment entries
- due calculation
- customer account summaries

### Phase 4: Customer Portal

- login
- dashboard
- delivery history
- bills and dues

### Phase 5: Polish

- mobile refinements
- analytics/report cards
- export options
- notifications/reminders if needed

## Proposed Folder Structure

Detailed structure is documented in [docs/project-structure.md](/Users/mukeshrai/Desktop/Work/GIT/milkman/docs/project-structure.md).

Implementation planning is documented in [docs/planning.md](/Users/mukeshrai/Desktop/Work/GIT/milkman/docs/planning.md).

## MVP Recommendation

To keep the app lightweight, the first MVP should include:

- secure login
- super admin dashboard
- customer add/edit/list
- daily delivery status marking
- customer milk quantity plan
- payment entry and due summary
- customer self-view dashboard
- Hindi + English support

## Nice-to-Have Later

- WhatsApp reminders
- invoice PDF export
- recurring daily auto-entry generation
- area-wise customer grouping
- morning/evening delivery split
- holiday/pause management
- PWA install support

## Build Principles

- keep the schema simple
- avoid heavy dependencies unless they reduce real effort
- optimize for daily operational speed
- prefer server components where helpful
- use client components only for interactive flows
- keep forms reusable and validation centralized

## Next Step

Recommended next implementation step:

1. scaffold Next.js app with TypeScript and Tailwind
2. add base folder structure from `docs/project-structure.md`
3. set up MongoDB connection and env handling
4. implement auth + role protection
5. build admin customer module first

