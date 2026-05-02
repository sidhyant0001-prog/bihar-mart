# Patna Realty Manager

## Overview

Full-stack real estate complex management platform for Patna, Bihar, India. Manages residential flats (2BHK/3BHK/4BHK), shops, grocery stores, and market units — with rent collection, tenant portals, buyer listings, and admin dashboards.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/patna-realty) — warm terracotta/slate design
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts

## User Roles & Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@patnacomplex.com | Admin@123 |
| Tenant | suresh@gmail.com | Tenant@123 |
| Shopkeeper | meena.devi@gmail.com | Tenant@123 |
| Buyer | amit.verma@gmail.com | Buyer@123 |

## Key Features

- **Public listing**: Browse all properties with photos, filtering by type/BHK/price
- **Admin dashboard**: Summary stats, rent roll, collection reports, occupancy charts
- **Property management**: Full CRUD for flats, shops, grocery stores, markets
- **Tenant management**: Tenant profiles with Aadhar, emergency contacts
- **Lease management**: Flexible periods (daily/weekly/monthly/yearly), auto-renew
- **Payment tracking**: Invoices, partial payments, late fees, UPI/card/cash/bank transfer
- **Maintenance requests**: Priority-based workflow with admin notes
- **Buyer inquiries**: Lead tracking with status management
- **Tenant portal**: View lease, pay rent, submit maintenance requests

## Routes

### Public
- `/` — Landing page
- `/properties` — Property listings with filters
- `/properties/:id` — Property detail + inquiry form
- `/login`, `/register` — Auth pages

### Admin (login as admin)
- `/admin` — Dashboard with metrics
- `/admin/properties` — Manage all properties
- `/admin/tenants` — Manage tenants
- `/admin/leases` — Manage leases
- `/admin/payments` — Payment management
- `/admin/rent-roll` — Monthly rent roll report
- `/admin/collection-report` — Revenue analytics
- `/admin/maintenance` — Maintenance requests
- `/admin/inquiries` — Buyer inquiry management

### Tenant Portal (login as tenant/shopkeeper)
- `/tenant` — Tenant dashboard
- `/tenant/payments` — Pay rent, view invoice history
- `/tenant/maintenance` — Submit and track maintenance requests

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas (server-side validation)
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/patna-realty/src/` — React frontend

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
