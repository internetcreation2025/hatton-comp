# Testing before you roll it out

Work through these in order. Each round takes about ten minutes. Anything that
doesn't behave the way it says here, tell me what you saw and I'll fix it.

**Before you start:** delete the old icon from your home screen. It's got the old
name and the old icon baked in.

---

## Round 0 — get set up properly (5 mins)

Everything else depends on this working.

| Do this | You should see |
|---|---|
| Open https://hatton-comp.vercel.app in **Safari** on your iPhone | The join screen with the club logo |
| Enter the code and your name | The games list |
| Tap Share (square with an arrow) → **Add to Home Screen** → Add | An icon appears called **Hatton Competitors**, showing the yellow ball |
| **Close Safari.** Open the app from the new icon | Full screen, no browser bar at the top |
| Go to **You** → Notifications → **Turn notifications on** | iPhone asks permission. Say Allow. Button changes to "Turn notifications off" |

> If it shows Add-to-Home-Screen instructions instead of a switch, you're still in
> Safari rather than the installed app. Open it from the icon.

**Do not skip the notifications step.** If it fails here, stop and tell me —
nothing after this is worth testing until it works.

---

## Round 1 — on your own (10 mins)

This covers most of the app. You don't need anyone else.

| Do this | You should see |
|---|---|
| Tap **New game** | Today's date, next round hour, 1½ hrs, Hatton |
| Set it for tomorrow evening, tap **Create game** | The game, with you in slot 1, and a big **"Game's in. Tell the group."** panel |
| Tap **Not now** | The panel disappears and doesn't come back on refresh |
| Tap **Add a player** | A panel. Anyone in the group who isn't in this game is listed to tap; below that, a box to type a name |
| Type "Test Guest", tap Add | They fill slot 2 with a "Guest" tag |
| Add two more by name | The badge changes to **Game on**, slots all full |
| Tap **Add a player** again | It warns that anyone added now goes on the waitlist |
| Tap **Remove Test Guest** | Back to 3 players, "1 needed" |
| Tap **Drop out** | You leave, 2 players left |
| Tap **Count me in** | You're back, in the last slot |
| Tap **Edit**, change the time, Save | New time shown, and "updated the details" in the activity log |
| Scroll to **What's happened** | A plain-English list of everything you just did, with times |
| Go to **You** → Appearance → **Dark** | Whole app goes dark instantly. Tap Light to go back |

**Now test the one-court rule:**

| Do this | You should see |
|---|---|
| Create a second game at **Hatton** that overlaps the first | A message naming the game that's in the way |
| Change it to start exactly when the first one ends | Saves fine — back-to-back is allowed |
| Change the venue to **Bathgate**, same time as the first | Saves fine — other venues have more than one court |

---

## Round 2 — two people (10 mins)

This is the important round. You need a **laptop or a second device** — it acts
as another player. A private/incognito window works too.

1. On the laptop, open the app and join with a different name, e.g. "Test
   Player".
2. Turn notifications on there as well (Chrome will ask).

Now, with your phone in one hand and the laptop in front of you:

| Do this | What should happen |
|---|---|
| On the **laptop**, create a game | Your **phone buzzes**: "New game — …" |
| On the **phone**, tap that notification | The app opens on that exact game |
| On the phone, tap **Count me in** | You appear in a slot on the laptop when it refreshes |
| On the **laptop**, tap **Add a player** | Your name now appears under "From the group", because there are two of you. Tap it — you should get a **notification that they put you in a game** |
| Fill the remaining slots by name from the laptop | Whoever fills the last slot gets **"That's four — game on."** and both of you get a notification |
| On the **phone**, tap **Drop out** | The laptop gets "A spot has opened up", and your phone offers **"A spot's opened up. Post it."** |
| On the laptop, tap **Count me in** twice quickly | You only go in once — no duplicate |

**The waitlist:**

| Do this | What should happen |
|---|---|
| Fill a game to four, then join from the laptop | "Sorry, that filled up" — laptop lands on the **Waiting** list |
| From the phone, drop out | The laptop person is **promoted automatically** into the free slot and notified |

---

## Round 3 — the WhatsApp bit (5 mins)

Test this by messaging **yourself** on WhatsApp first, not the group.

| Do this | You should see |
|---|---|
| On a game, tap **Post this to WhatsApp** | WhatsApp opens with the message written |
| Send it to yourself (search your own name) | A **card**: date, time, venue, the four slots, "2 spots left" |
| Add a player in the app, then post the same game again | The new card shows the **updated** line-up, not the old one |
| Tap your own card | The app opens on that game |

**Then the most important one — someone who's never used it:**

| Do this | You should see |
|---|---|
| Send the game link to **one mate who isn't set up yet** | They tap it → they see *that game*, with "Add your name" |
| They enter the code and their name | They land **on that game**, not the home page |
| They tap Count me in | They're in, and your phone buzzes |

If that last sequence works smoothly, the whole thing works.

---

## Round 4 — the timed stuff

Two things run on a schedule and can't be tested by tapping:

- The **"padel today"** reminder, a few hours before a game
- The **"still 2 short"** nudge for a game coming up that needs players

Tell me when you want these tested and I'll set up a game at the right time and
trigger the job by hand, so you can watch the notifications arrive on your phone.
Takes about two minutes.

---

## Round 5 — a real game, small

Before the whole group: pick **two or three regulars**, send them the link, and
arrange **one real game** through the app. A week of actual use finds things no
checklist will.

---

## When you're happy

Tell me and I'll wipe every test account, game and guest so the group starts on a
clean, empty app. Then put the link and the code in the group description and
post it in the chat.

---

## What to tell me if something's wrong

- Which round and which row
- What you expected, what happened
- Whether you were on the phone or the laptop

I can see the server logs and the database, so "it did nothing when I tapped
Create" is enough to go on — I don't need a screenshot.
