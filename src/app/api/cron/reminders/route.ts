import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGame } from "@/lib/games";
import { notifyMembers } from "@/lib/push";
import { formatShortDate, formatTime } from "@/lib/time";
import type { Game } from "@/lib/types";

/**
 * The hourly job. Two things:
 *
 * 1. Reminds the players a few hours before their game.
 * 2. Spots a game that's coming up and still short of players, and nudges
 *    whoever set it up to put it in the WhatsApp group. The app decides when
 *    the group needs telling; the person only has to tap.
 *
 * Both are marked once done, so nobody gets nagged twice.
 */

export const dynamic = "force-dynamic";

const REMINDER_LOOKAHEAD_MS = 3 * 60 * 60 * 1000 + 15 * 60 * 1000; // ~3 hours
const NUDGE_LOOKAHEAD_MS = 36 * 60 * 60 * 1000; // a day and a half
const NUDGE_MIN_NOTICE_MS = 4 * 60 * 60 * 1000; // no point nagging at the last minute

export async function GET(request: Request) {
  console.log("[cron/reminders] start");

  // Vercel signs its cron calls; we also accept our own shared secret so this
  // can't be triggered by a stranger who finds the URL.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "not allowed" }, { status: 401 });
  }

  const now = new Date();
  let reminded = 0;
  let nudged = 0;

  /* --- 1. "Your game is soon" -------------------------------------------- */

  const { data: dueData, error: dueError } = await db()
    .from("games")
    .select("*")
    .is("reminder_sent_at", null)
    .neq("status", "cancelled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", new Date(now.getTime() + REMINDER_LOOKAHEAD_MS).toISOString());

  if (dueError) {
    console.error("[cron/reminders] reminder query failed", dueError.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  for (const row of dueData as Game[]) {
    const game = await getGame(row.id);
    if (!game || game.players.length === 0) continue;

    await notifyMembers(
      game.players.map((p) => p.member_id),
      {
        title: "Padel today",
        body: `${formatTime(game.starts_at)} at ${game.venue}${game.court ? `, court ${game.court}` : ""}.`,
        url: `/game/${game.id}`,
      },
    );

    await db()
      .from("games")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", game.id);

    reminded += 1;
  }

  /* --- 2. "This one still needs players" --------------------------------- */

  const { data: shortData, error: shortError } = await db()
    .from("games")
    .select("*")
    .is("nudge_sent_at", null)
    .eq("status", "open")
    .gte("starts_at", new Date(now.getTime() + NUDGE_MIN_NOTICE_MS).toISOString())
    .lte("starts_at", new Date(now.getTime() + NUDGE_LOOKAHEAD_MS).toISOString());

  if (shortError) {
    console.error("[cron/reminders] nudge query failed", shortError.message);
  } else {
    for (const row of shortData as Game[]) {
      const game = await getGame(row.id);
      if (!game || game.spotsLeft === 0) continue;

      const needed = game.spotsLeft;
      await notifyMembers([game.created_by], {
        title: `Still ${needed} short for ${formatShortDate(game.starts_at)}`,
        body: `${formatTime(game.starts_at)} at ${game.venue}. Tap to post it in the group.`,
        url: `/game/${game.id}?tell=needs`,
      });

      await db()
        .from("games")
        .update({ nudge_sent_at: new Date().toISOString() })
        .eq("id", game.id);

      nudged += 1;
    }
  }

  console.log(`[cron/reminders] done — ${reminded} reminded, ${nudged} nudged`);
  return NextResponse.json({ ok: true, reminded, nudged });
}
