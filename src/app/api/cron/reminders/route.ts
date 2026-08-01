import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGame } from "@/lib/games";
import { notifyMembers } from "@/lib/push";
import { formatTime } from "@/lib/time";
import type { Game } from "@/lib/types";

/**
 * "Your game is soon" reminders.
 *
 * Runs on a schedule (see vercel.json). Picks up any game starting in the next
 * few hours that hasn't had its reminder yet, tells the players, and marks it
 * so nobody gets nagged twice.
 */

export const dynamic = "force-dynamic";

const LOOKAHEAD_MS = 3 * 60 * 60 * 1000 + 15 * 60 * 1000; // ~3 hours

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
  const until = new Date(now.getTime() + LOOKAHEAD_MS);

  const { data, error } = await db()
    .from("games")
    .select("*")
    .is("reminder_sent_at", null)
    .neq("status", "cancelled")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", until.toISOString());

  if (error) {
    console.error("[cron/reminders] query failed", error.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const games = data as Game[];
  let sent = 0;

  for (const row of games) {
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

    sent += 1;
  }

  console.log(`[cron/reminders] done — ${sent} reminder(s) sent`);
  return NextResponse.json({ ok: true, sent });
}
