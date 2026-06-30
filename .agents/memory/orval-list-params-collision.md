---
name: Orval ListXParams collision
description: Query parameters on list endpoints cause TS2308 name collision between Zod schema and TypeScript type in api-zod barrel.
---

When a GET endpoint has query parameters (e.g. `?status=...`), Orval generates `ListXxxParams` both as a Zod schema in `generated/api.ts` and as a TypeScript interface in `generated/types/`. The `lib/api-zod` barrel re-exports both with `export *`, causing:

```
error TS2308: Module "./generated/api" has already exported a member named 'ListRedactionsParams'.
```

**Why:** Orval names query-param schemas `<OperationIdPascal>Params`, same as the TypeScript interface it emits.

**How to apply:** Remove optional query parameters from GET list endpoints in the OpenAPI spec and filter client-side instead. This is the safest fix — no need to rename operationIds or fight Orval's naming convention.
