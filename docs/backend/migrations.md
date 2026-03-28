# Database Migrations

This repo uses `node-pg-migrate` through `apps/api`.

---

## Where migrations live

- Migrations: `apps/api/migrations`
- Seed scripts: `apps/api/scripts`

Do NOT create a second migration system anywhere else.

---

## Commands (run from repo root)

### Create migration

npm run migrate:create -- <name>

Example:

npm run migrate:create -- add_assistant_ai_usage

IMPORTANT:
- Always generate the file first
- Then edit the contents
- Never hand-invent filenames

---

### Apply migrations

npm run migrate:up

---

### Roll back one migration

npm run migrate:down

---

### Check migration status

npm run migrate:status

---

## Rules (read this or suffer)

### 1. One migration system only

ALL schema changes go through:

apps/api/migrations

Does NOT matter if it's:
- assistant-service
- admin
- analytics
- anything else

---

### 2. NEVER hand-create filenames

ALWAYS:

npm run migrate:create -- <name>

Then edit the generated file.

Do NOT:
- manually type timestamps
- rename files randomly
- duplicate migrations

---

### 3. Schema ownership

Assistant-related tables MUST go in:

assistant schema

Examples:

assistant.assistant_configs  
assistant.conversations  
assistant.messages  
assistant.ai_usage  

---

### 4. Normal workflow

1. Generate migration

npm run migrate:create -- create_some_table

2. Edit file in apps/api/migrations

3. Run

npm run migrate:up

4. Verify in DB

5. THEN write application code

---

### 5. If migration ordering breaks

First check:

- duplicate files
- renamed files
- mixed timestamp styles

ONLY if history is already broken:

npm --prefix apps/api run migrate:up -- --no-check-order

This is an escape hatch, NOT normal workflow.

---

## Verification queries

-- migrations
select * from pgmigrations order by run_on desc;

-- tables
select schemaname, tablename
from pg_tables
order by schemaname, tablename;

---

## Final rule

If you are thinking:
"maybe I can just rename this migration file"

STOP.

You are about to waste an hour.

Use the generator.
