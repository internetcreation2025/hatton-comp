# Hatton Padel

A small private app for a WhatsApp group that arranges padel games. Each game is
a card with a date, time, venue and four slots. People tap a slot to join and tap
again to drop out — so the game stops living in a chat bubble that scrolls away.

See [project_specs.md](project_specs.md) for the full brief.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase ·
Vercel · PWA with Web Push

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

## Environment variables

| Name | What it's for |
| --- | --- |
| `SUPABASE_URL` | The Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database access. Never expose this to the browser. |
| `GROUP_CODE` | The code people type on `/join` |
| `SESSION_SECRET` | Signs the "who you are" cookie |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push, public half |
| `VAPID_PRIVATE_KEY` | Web push, private half |
| `VAPID_SUBJECT` | `mailto:` address for push |
| `CRON_SECRET` | Protects the reminder endpoint |

## How security works here

There are no Supabase user accounts. Identity is a signed, HTTP-only cookie
issued after someone enters the group code. Every read and write happens in
server code using the service role key; the browser never talks to Supabase
directly. Row Level Security is enabled on every table with no policies, so the
data is unreachable from outside the server even if the anon key leaked.
