# Hatton Competitors — Project Spec

**Status:** Draft — awaiting approval
**Date:** 1 August 2026

---

## 1. What the app does and who uses it

**The problem.** A WhatsApp group ("Hatton competitors") is used to arrange padel games. Someone posts a message like:

```
Anyone fancy this tonight
1800 -1930
🎾 Robert
🎾
🎾
🎾
```

…and people reply adding their name until four players are in. This works, but:

- The game "lives" inside a chat bubble that scrolls away within an hour.
- You can only pin one message, so a second game in the same week gets lost.
- Editing means posting the whole list again, so there are several versions of the truth.
- Nobody can see at a glance what's already booked for next week.

**The solution.** A small private web app that is the single place where games live. Each game is a card with a date, time, venue and four player slots. People tap a slot to add themselves, tap again to drop out. WhatsApp stays the place where people *shout*; the app is the place where the truth is *stored*.

**Who uses it.** Members of the Hatton competitors WhatsApp group — roughly 10–25 people, all adults, all on phones, none of them technical. It is private: no public sign-up page, no search engine listing.

---

## 2. Tech stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | Same as your other projects |
| Styling | Tailwind CSS 4 | Same as your other projects |
| Database | Supabase (Postgres) | Same as your other projects |
| Hosting | Vercel | Same as your other projects |
| Phone app | PWA (installable web app) | No App Store, no £99/yr Apple fee, no review process — people tap "Add to Home Screen" and it looks and opens like a real app |
| Notifications | Web Push (VAPID) via the `web-push` library | Free, no Twilio/SMS costs |
| Time zone | Everything displayed in Europe/London; stored in UTC | Avoids the "is that 5pm or 6pm?" problem across BST/GMT |

**No** Stripe, **no** email service, **no** SMS provider. Nothing in this app costs money to run beyond the Vercel/Supabase free tiers.

---

## 3. How people get in (auth)

Chosen approach: **group code + pick your name.**

1. You post one link in the WhatsApp group, e.g. `hattonpadel.vercel.app`.
2. First time someone opens it they see a single screen: *"Enter the group code"*.
3. The code is a short word/phrase you set (stored as an environment variable — not in the code).
4. They then type their name once. That's it — they're in.
5. Their name is remembered on that phone for a year via a signed, HTTP-only cookie. They will not be asked again.

**Deliberately accepted trade-offs**, so there are no surprises later:

- Anyone who gets the link *and* the code can join. That's fine — it's a padel group, not a bank.
- Someone could in theory type someone else's name. Mitigated by: every action is stamped with who did it ("Mike added Stephen — 17:30"), so mischief is visible rather than prevented.
- If the code ever leaks, you change one environment variable and re-share. Existing members are **not** logged out.

**Security implementation note.** Because there are no real Supabase user accounts, the browser never talks to Supabase directly. All reads and writes go through Next.js server routes that hold the `service_role` key server-side. Row Level Security is switched **on** with no public policies, so even if the database URL leaked, nothing is readable from outside. The `service_role` key never appears in client-side code.

**Admins.** One or two members (you) get an `is_admin` flag, set manually in the database. Admins can edit or cancel any game; everyone else can only edit games they created (but *anyone* can add or remove *themselves* from any game).

---

## 4. Pages and user flows

### Public (not signed in)
| Page | What's on it |
|---|---|
| `/join` | Group code box → name box → done. The only page a stranger can reach. |

### Signed in
| Page | What's on it |
|---|---|
| `/` **Upcoming** | The home screen. A list of upcoming game cards, soonest first, grouped by day ("Today", "Tomorrow", "Tuesday 4 Aug"). Each card shows time, venue, and four slots with names or "empty". Big obvious "+ New game" button. |
| `/game/[id]` **Game detail** | Full view of one game: date/time, venue, court, notes, the four slots, the waitlist, and a plain-English activity log ("Robert created this game 05:34 · Mike joined 09:12"). Buttons: Join / Leave, Add a player, Share to WhatsApp, Edit, Cancel. |
| `/new` **Create game** | Date, start time, duration (default 90 min), venue (dropdown, remembers recent), court number (optional), notes (optional). Creator is added to slot 1 automatically, with a tick-box to opt out if they're organising but not playing. |
| `/past` **History** | Games that have already happened, newest first. Read-only. |
| `/me` **You** | Change your display name, turn notifications on/off, "How to add this to your home screen" instructions, sign out. |

### Core flow: create → fill → play
1. Robert opens the app, taps **+ New game**, picks Tuesday 4 Aug, 17:00, 90 mins, Hatton. Taps Create.
2. Everyone with notifications on gets: *"Robert created a game — Tue 4 Aug, 5pm at Hatton. 3 spots left."*
3. Robert taps **Share to WhatsApp** — a tidy summary plus the link drops into the group chat.
4. Mike opens the link, taps an empty slot, he's in. Two spots left.
5. Two more join. When the fourth joins, everyone in that game gets: *"Game on — Tue 4 Aug 5pm, Hatton is full."*
6. Someone drops out on the day → the first person on the waitlist is offered the spot and notified; if nobody's waiting, everyone gets *"A spot has opened up for tonight."*

### Edge cases the app must handle
- **Two people tap the last slot at the same time.** The database enforces the four-player limit, so the second person is told "Sorry, that filled up — you're first on the waitlist" rather than creating a 5-player game.
- **Adding other people.** "Add a player" lists everyone in the group who isn't
  already in the game — tap a name to put them in, and they're notified. The same
  panel takes a typed name for someone outside the group ("Dave from work"), who
  occupies a slot without needing an account. **Anyone can add anyone**, because
  the chat habit is "put me down for Tuesday" and whoever reads it first should
  be able to act. Every add is stamped with who did it.
- **Dropping out.** Always allowed, but if it's within 24 hours of the game the app shows a gentle confirm: *"This game is tomorrow — the others will be notified. Still leaving?"*
- **Cancelled games.** Never deleted — marked cancelled, greyed out, and everyone in the game is notified.
- **Past games** auto-move out of Upcoming once the end time passes. No manual tidying.
- **Hatton has one court.** Two games at Hatton can never overlap. The database
  enforces it, so two people creating a game at the same moment can't both
  succeed — the second is told which game is in the way. Back-to-back games are
  fine (5:00–6:30 then 6:30–8:00), cancelling a game frees its slot, and other
  venues are unaffected because they have more than one court.

---

## 5. Data models

All tables live in Supabase Postgres with RLS enabled and no public policies.

**`members`** — one row per person
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| display_name | text | e.g. "Mike Sutherland" |
| colour | text | auto-assigned, for their initials avatar |
| is_admin | boolean | default false, set by hand |
| created_at / last_seen_at | timestamptz | |

**`games`** — one row per game
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| starts_at / ends_at | timestamptz | stored UTC |
| venue | text | default "Hatton" |
| court | text, nullable | |
| capacity | int | default 4 |
| notes | text, nullable | |
| status | text | `open` \| `full` \| `cancelled` |
| created_by | uuid → members | |
| created_at / cancelled_at | timestamptz | |

**`game_players`** — who is in which game
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| game_id | uuid → games, cascade delete | |
| member_id | uuid → members, nullable | null when it's a guest |
| guest_name | text, nullable | |
| status | text | `playing` \| `waitlist` |
| position | int | slot order / waitlist order |
| added_by | uuid → members | who put them there |
| joined_at | timestamptz | |

Constraint: a member can only appear once per game. The four-player cap is enforced in the database, not just in the UI.

**`game_events`** — the activity log that removes all doubt
`id`, `game_id`, `actor_member_id`, `type` (`created` \| `joined` \| `left` \| `edited` \| `cancelled` \| `guest_added`), `detail` (text), `created_at`.

**`push_subscriptions`** — one row per device that's opted in
`id`, `member_id`, `endpoint`, `p256dh`, `auth`, `created_at`.

**Where data is stored:** Supabase (EU region). Nothing sensitive is held — names, dates and venues only. No phone numbers, no emails, no payment details.

---

## 5a. WhatsApp — what is and isn't possible (decided 2 Aug 2026)

The original hope was that the app would post straight into the "Hatton
competitors" group with no chat picker. **WhatsApp does not allow this**, and
not because of anything in this app:

- `wa.me` links open WhatsApp with the message written, but the chat picker is
  WhatsApp's and cannot be pre-filled with a group.
- Group invite links (`chat.whatsapp.com/…`) let people *join* a group. They
  provide no way to *post* to one.
- The official WhatsApp Business API does not support ordinary consumer group
  chats at all, so paying for it would not help.
- Unofficial libraries that drive WhatsApp Web can fake it, but they breach
  WhatsApp's terms and risk the account being banned. Not worth it for this.

**The decision:** the app's own push notifications are the noticeboard — they
genuinely are instant and automatic. A prompt appears on the games list for
anyone who hasn't switched notifications on yet, and can be dismissed for good.

**Closing the loop (2 Aug 2026).** Posting can't be automated, but the other
three parts of the loop can be, and are:

1. **Link previews.** A game link pasted into WhatsApp unfurls as a card — date,
   time, venue, the four slots, and how many are still needed — drawn fresh on
   every request. The share button appends a changing query string, because
   WhatsApp caches one preview per URL and a second post about the same game
   would otherwise show a stale line-up.
2. **The return trip.** Tapping a game link while signed out shows that game and
   a way in, rather than the front door. After the code and name, the person
   lands back on the game they were invited to. Redirect targets are restricted
   to in-app paths so a doctored link can't bounce someone elsewhere.
3. **Asking at the right moment.** After creating a game, filling the last slot,
   losing a player, or cancelling, the app puts up one button to tell the group —
   while the phone is still in their hand.
4. **Noticing on your behalf.** The hourly job spots a game that's coming up and
   still short of players, and nudges whoever created it to post about it. Once
   per game.

The one route to genuinely automatic posting — a bot phone number in the group —
is written up in [whatsapp-bot-option.md](whatsapp-bot-option.md), along with why
it isn't recommended.

**Who gets in:** the app cannot check WhatsApp group membership either. In
practice the app link and the group code live in the WhatsApp group's
description, which only members can read.

## 6. Notifications — how they actually work

- Uses the **Web Push** standard, which is free. No SMS, no email.
- On the `/me` page there's one toggle: *"Notify me about games"*. Tapping it triggers the phone's permission prompt.
- **Important iPhone caveat, stated up front:** iPhones only allow web push if the app has been **added to the Home Screen first**. So the `/me` page shows step-by-step "Add to Home Screen" instructions before offering the toggle. Android and desktop work either way.
- Anyone who declines or ignores notifications loses nothing — the WhatsApp share button covers them.

**What triggers a notification**
| Event | Who gets it |
|---|---|
| New game created | Everyone opted in |
| Game becomes full | The four players |
| Someone drops out | The remaining players, plus the waitlist |
| Game edited (time/venue changed) | The players in it |
| Game cancelled | The players in it |
| Reminder, 3 hours before | The players in it |

Sending is done by a server route using the `web-push` library and a VAPID key pair stored in environment variables. The 3-hour reminder runs off a Vercel cron job.

---

## 7. Third-party services

| Service | What it's for | Cost |
|---|---|---|
| Supabase | Database | Free tier |
| Vercel | Hosting + cron for reminders | Free tier |
| Web Push (browser-native) | Notifications | Free |

That's the complete list. No Stripe, no Twilio, no email provider.

---

## 8. Design direction

Phone-first, one-handed. Dark by default (it matches WhatsApp, and most of this happens in the evening), with a light mode that follows the phone's setting.

- Game cards are the whole interface — big, tappable, with the four slots shown as a clear row.
- Empty slots look genuinely empty and inviting to tap; filled slots show initials in a coloured circle plus the name.
- One primary action per screen. The "+ New game" button is always reachable with a thumb.
- Subtle motion only: a slot filling in animates gently; nothing bounces or spins.
- No emoji icons, no gradients. Clean type, generous spacing, a single accent colour (padel-court blue).
- Everything readable at arm's length outdoors — real contrast, no thin grey text.

---

## 9. What "done" looks like for version 1

Version 1 is finished when all of the following are true:

1. Someone in the group can open the link on their phone, enter the code, type their name, and reach the games list in under 30 seconds.
2. They can add the app to their home screen and it opens full-screen with its own icon, no browser bar.
3. Any member can create a game with date, time, venue and notes.
4. Any member can join a game, leave a game, and add a named guest.
5. A game with four players is full; a fifth person joins the waitlist automatically, and is promoted if someone drops out.
6. Games can be edited and cancelled; cancelled games are visible but clearly struck out, never silently deleted.
7. Every game shows a plain-English log of who did what and when.
8. Games move to History automatically once they've finished.
9. Push notifications fire for the six events listed in section 6, on Android and on iPhone (once home-screen-installed).
10. "Share to WhatsApp" produces a clean, readable message with the game details and a direct link.
11. `npm run build` passes with no type or lint errors, and the app has been tested end-to-end in a real phone browser — happy path *and* error paths (wrong code, game already full, no network).

### Explicitly NOT in version 1
Kept out on purpose to get this into people's hands quickly — all straightforward to add later:
- Recurring games ("every Tuesday 5pm")
- Scores, results, leaderboards
- Court booking availability tracking (the "when do slots get released?" question from the chat)
- Cost splitting / payments
- Multiple groups — this app serves one group

---

## 9a. Where things live

| Thing | Where |
| --- | --- |
| Live app | https://hatton-comp.vercel.app |
| Code | https://github.com/internetcreation2025/hatton-comp (pushes to `main` deploy automatically) |
| Database | Supabase project **HattComp** (`hijrblbefgpxdkdzcvvj`), eu-central-1 |
| Hosting | Vercel project **hatton-comp**, team "Internet Creation's projects" |
| Reminder cron | Vercel cron, hourly, hits `/api/cron/reminders` |

The Supabase project was an unused care-home trial that has been repurposed.
Its old empty tables (`care_homes`, `tickets`, `profiles`, etc.) are still
there, untouched, and can be dropped whenever you like.

## 10. Decisions (confirmed 1 Aug 2026)

1. **App name** — "Hatton Competitors", matching the WhatsApp group. This is
   what appears under the icon when the app is added to a home screen.
2. **Venue** — defaults to "Hatton", but the field is free text so anyone can type their own (Bathgate, David Lloyd, etc.). Recently used venues appear as quick-pick suggestions.
3. **Game length** — 90 minutes by default, changeable per game.
4. **Group code** — set. Stored only in `.env.local` / Vercel environment variables as `GROUP_CODE`; never written into code or into this file.
