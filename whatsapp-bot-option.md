# Auto-posting into the WhatsApp group: what it would actually take

**Written 2 August 2026. Nothing has been built. This is for you to decide on.**

---

## The short version

It is possible. It is also the only part of this project I'd advise against, and
the reason is not difficulty — it's that you'd be building on something that can
be switched off without warning by someone who isn't you.

---

## Why the honest routes don't work

**WhatsApp Business API (the official one).** Meta's paid platform for sending
WhatsApp messages. It handles one-to-one conversations with customers. It does
**not** send into ordinary consumer group chats — the kind "Hatton competitors"
is. This isn't a pricing tier you can buy your way into; the capability doesn't
exist. So the official door is shut.

**Group invite links.** `chat.whatsapp.com/…` links let someone *join* a group.
There is no equivalent for *posting* to one.

**`wa.me` links.** What the app uses now. Opens WhatsApp with the message
written, but the chat picker belongs to WhatsApp and can't be pre-filled.

That leaves exactly one route.

---

## The only route that works

A **second phone number** joins the group as a member. A program running on a
server pretends to be that number's WhatsApp Web session — the same connection
you get when you scan the QR code on web.whatsapp.com — and sends messages
through it. The usual libraries are `Baileys` or `whatsapp-web.js`.

To the group it looks like an extra member called something like "Hatton Bot"
that posts when a game changes.

### What you'd need to buy and set up

| Thing | Detail | Cost |
|---|---|---|
| A spare mobile number | A cheap PAYG SIM, kept alive. Can't be your own number — see the ban risk below. | ~£10 one-off, plus a few £ a year to keep the number active |
| An always-on server | Vercel can't do this. The connection has to stay open permanently, and Vercel shuts functions down after seconds. You'd need a small always-running box — Railway, Fly.io, Hetzner or similar. | ~£4–£8 a month |
| The bot added to the group | You add the number to "Hatton competitors" like any other member | free |
| Building it | Roughly a day: the WhatsApp connection, the QR login flow, a queue so messages aren't lost when the connection drops, and a way for you to re-scan the QR when it does | — |

Call it **£60–£100 in the first year**, then ~£70/year, plus a day's work.

### What breaks, and how often

- **The session drops.** WhatsApp Web sessions expire, get logged out by phone
  restarts, or break on WhatsApp updates. Expect to re-scan a QR code by hand
  every few weeks to few months. If you don't notice, the group silently stops
  getting posts — which is worse than never having had them, because people stop
  checking the app too.
- **WhatsApp updates break the library.** These are reverse-engineered, not
  supported. A WhatsApp protocol change can stop it working until the library's
  volunteers catch up. That has historically taken days to weeks.
- **The number can be banned.** This is the real one. Automating WhatsApp
  breaches their terms of service. Bans are automatic, unappealable in practice,
  and permanent for that number. It doesn't take your personal account with it —
  which is exactly why the bot must be a separate number and never yours.

### What it would actually gain you

One tap. That's it.

Today: something happens → the app puts a button in front of you → you tap it →
you tap "Hatton competitors" → sent.

With a bot: something happens → it appears in the chat.

---

## My recommendation

Don't. Not because it can't be done, but because the return is one tap and the
cost is a permanent maintenance job on something designed to resist you. Every
few weeks you'd be re-scanning a QR code to keep a padel group's noticeboard
alive, and the failure mode is silence rather than an error.

The app already does the parts that matter automatically: it decides when the
group needs telling, writes the message, and now unfurls in the chat as a proper
card that people can tap straight into. What's left is a thumb.

**A fairer test:** use it for a month. If the group genuinely stalls because
people aren't posting the prompts, that's real evidence and this document is
still here. If the notifications carry it — which I'd expect, since they reach
everyone instantly with no taps at all — then WhatsApp posting was never the
bottleneck.

---

## If you want it anyway

That's a completely reasonable call to make about your own group, and I'll build
it. What I'd need from you:

1. A spare mobile number, with the SIM in a phone you can get at (for the QR
   scan and the occasional re-scan).
2. A decision on where it runs — I'd suggest Railway, as it's the least fiddly.
3. Agreement that if the number gets banned, it gets banned. We'd design so that
   only the bot posting stops; the app itself would carry on untouched.
