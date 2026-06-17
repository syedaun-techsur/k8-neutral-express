wave: 1
domain: database
depends_on: []
features: [F7]
objective: "Create the PostgreSQL notes table via idempotent DDL (CREATE TABLE IF NOT EXISTS), wire up the lib/db.js singleton pool, and run auto-migration through instrumentation.js on startup — zero manual setup required."
estimated_plans: 1
---
wave: 2
domain: backend
depends_on: [1]
features: [F5, F6]
objective: "Implement all five REST API endpoints (GET/POST /api/notes, GET/PUT/DELETE /api/notes/[id]) plus the GET /api/health liveness check, with full input validation, parameterized queries, and correct HTTP status codes."
estimated_plans: 2
---
wave: 3
domain: frontend
depends_on: [2]
features: [F0, F1, F2, F3, F4, F8, F9]
objective: "Build all UI pages (note list with search, create form, edit+delete form) using plain CSS Modules with the mobile-first design system; configure next.config.mjs for iframe compatibility and 0.0.0.0:3000 port binding."
estimated_plans: 3
---
wave: 4
domain: integration
depends_on: [1, 2, 3]
features: [F0, F1, F2, F3, F4, F5, F6, F7, F8, F9]
objective: "Verify end-to-end flows: startup auto-migration, full CRUD cycle through UI and API, search accuracy, iframe rendering, port binding, header constraints, mobile tap targets, and data durability across restarts."
estimated_plans: 1
