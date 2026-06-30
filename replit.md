# Redact Review

A PII redaction review platform that helps legal professionals catch what the AI missed — not just fix what it got wrong.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/redact-review run dev` — run the frontend (port 18767)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/documents.ts` — documents table
- `lib/db/src/schema/redactions.ts` — redactions table (with category/status/source enums)
- `artifacts/api-server/src/routes/documents.ts` — document CRUD + summary + complete
- `artifacts/api-server/src/routes/redactions.ts` — redaction CRUD (confirm/reject/user-add)
- `artifacts/api-server/src/routes/suspicious.ts` — PII pattern scanner for missed detections
- `artifacts/redact-review/src/` — React frontend

## Architecture decisions

- **Suspicious text detection is pure regex on the server**, not AI — runs at request time against unredacted spans. Patterns cover phone, email, SSN, DOB, names (title-prefixed), street addresses, credit cards, account numbers.
- **Status model**: redactions have `status` (pending | confirmed | rejected | user_added) and `source` (ai | user). User-added redactions always start as `user_added`.
- **False positive vs missed PII distinction**: the UI shows AI-flagged redactions in amber (pending) and user-found missed PII in purple. Suspicious text scanner findings shown in orange warning — highest visual priority.
- **Document auto-transitions to `in_review` on first GET** — no separate "start review" API call needed.
- **No auth** — this is a single-reviewer tool; auth can be added via Clerk when multi-user support is needed.

## Product

- Dashboard: list documents, track review progress per document, create new documents
- Review workspace: inline document highlighting, confirm/reject AI suggestions, keyboard shortcuts (J/K/C/R/S), select text to add missed PII, suspicious text scanner panel
- Completion screen: category breakdown, risk score, review summary

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The `listRedactions` endpoint must NOT have query parameters — Orval generates a `ListRedactionsParams` type that collides with the Zod schema of the same name. Filter client-side instead.
- Body schema names must be entity-shaped (`RedactionInput`, not `CreateRedactionBody`) to avoid TS2308 collisions.
- API server uses `pnpm run dev` which does build then start — changes require a rebuild.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
