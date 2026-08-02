<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hatton Competitors — Project Instructions

Global rules in `~/.claude/CLAUDE.md` apply. This file only adds what's specific to this project.

**Source of truth:** [project_specs.md](project_specs.md). Read it before any work. Don't build anything that isn't in it.

## Stack
Next.js 16 (App Router, `src/`) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres) · Vercel · PWA + Web Push (VAPID)

## Non-negotiables for this project
- **The browser never talks to Supabase directly.** There are no Supabase auth users — identity is a signed HTTP-only cookie. All reads and writes go through server code holding the `service_role` key. RLS is on with no public policies.
- **`service_role` key must never appear in client-side code or a `NEXT_PUBLIC_` variable.**
- **Times are stored in UTC, displayed in Europe/London.** Never format a date without an explicit time zone.
- **The 4-player cap is enforced in the database**, not just the UI — two people can tap the last slot at once.
- **Nothing is hard-deleted.** Cancelled games are marked, not removed.
- **Phone-first.** Every screen is designed for one thumb before it's designed for a desktop.
