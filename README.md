# Finance Emission API

Standalone Finance Emission API extracted from `NXMap_API` finance patterns, without user or company management.

## Scope

- Finance project CRUD
- Finance data-entry validation and calculation
- Finance raw API activity logging
- NxStart SSO-ready request context

## Out of Scope

- User management
- Company management
- Password or token issuance

## Project Layout

```text
src/
  app.js
  server.js
  config/
  middlewares/
  routes/
  integrations/nxstart/
  modules/
    finance-emission/
    reference-data/
    audit-log/
```

## NxStart Integration

This service assumes identity is managed externally.

Two integration modes are supported:

1. `AUTH_MODE=jwt`
   - Send `Authorization: Bearer <token>`
   - The service verifies the token using `NXSTART_JWT_SECRET`
2. `AUTH_MODE=header`
   - Upstream gateway injects JSON into `NXSTART_CONTEXT_HEADER`
   - Example header value:
     `{"sub":"user-1","companyId":"cmp-1","email":"user@example.com","displayName":"Finance User","roles":["finance:write"]}`

Mapped auth context is attached to `req.auth`.

## API Base Path

`/api/v1/finance-emission`

## Start

```bash
npm install
npm run dev
```

## Seed/Reference Data

The calculator expects reference collections compatible with the legacy NXMap finance module:

- `data_quality_scores`
- `cities`
- `eui_datas`

Collection names are configurable in `.env`.
