import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";

/** Save the browser's push subscription against whoever is signed in. */
export async function POST(request: Request) {
  console.log("[push/subscribe] start");

  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const body = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }

  // One row per device. Re-subscribing on the same device just updates it.
  const { error } = await db().from("push_subscriptions").upsert(
    {
      member_id: member.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    console.error("[push/subscribe] failed", error.message);
    return NextResponse.json({ error: "could not save" }, { status: 500 });
  }

  console.log("[push/subscribe] done —", member.display_name);
  return NextResponse.json({ ok: true });
}

/** Forget this device. */
export async function DELETE(request: Request) {
  console.log("[push/subscribe] delete start");

  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { error } = await db()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)
    .eq("member_id", member.id);

  if (error) {
    console.error("[push/subscribe] delete failed", error.message);
    return NextResponse.json({ error: "could not remove" }, { status: 500 });
  }

  console.log("[push/subscribe] delete done");
  return NextResponse.json({ ok: true });
}
