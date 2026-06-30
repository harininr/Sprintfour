---
name: Orval body naming rule
description: Request body component names must be entity-shaped, not operation-shaped, to avoid TS2308 collisions in the api-zod barrel.
---

For each operation with a body, Orval auto-derives a Zod schema named `<OperationIdPascal>Body` (e.g. `createNote` → `CreateNoteBody`) in `generated/api.ts`. It also emits a TypeScript interface under `generated/types/`. The api-zod barrel re-exports both, causing TS2308 if the names collide.

Collisions happen two ways:
1. Inline body — Orval invents `CreateNoteBody` as a TS type for the inline shape and emits it to types/.
2. A `$ref` to a component named `CreateNoteBody` — same collision.

**Why:** Orval owns the `<OperationIdPascal>Body` namespace for Zod schemas. Any component in that namespace triggers a duplicate export.

**How to apply:** Always `$ref` every body schema and name it after the entity, not the operation:
- Good: `NoteInput`, `RedactionInput`, `NoteUpdate`
- Bad: `CreateNoteBody`, `UpdateNoteBody`, `CreateRedactionBody`
