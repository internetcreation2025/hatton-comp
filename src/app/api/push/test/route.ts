import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import { notifyMembers } from "@/lib/push";

/**
 * "Send me a test notification."
 *
 * Proves someone's own notifications work without needing a second person and
 * a second game. Reports how many of their devices it went to, which is the
 * bit that catches the common mistakes — nothing signed up, or a second device
 * signed in under the same name.
 */
export async function POST() {
  console.log("[push/test] start");

  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const { count, error } = await db()
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member.id);

  if (error) {
    console.error("[push/test] count failed", error.message);
    return NextResponse.json({ error: "could not check" }, { status: 500 });
  }

  const devices = count ?? 0;
  if (devices === 0) {
    console.log("[push/test] no devices for", member.display_name);
    return NextResponse.json({ ok: true, devices: 0 });
  }

  await notifyMembers([member.id], {
    title: "That worked",
    body: `Notifications are on for ${member.display_name}. You'll hear about new games and spots opening up.`,
    url: "/me",
  });

  console.log(`[push/test] sent to ${devices} device(s) for ${member.display_name}`);
  return NextResponse.json({ ok: true, devices });
}
