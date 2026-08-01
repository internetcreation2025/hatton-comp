import "server-only";
import webpush from "web-push";
import { db } from "./db";

/**
 * Push notifications.
 *
 * Uses the browser's built-in Web Push standard — free, no SMS, no email.
 * If anything goes wrong here we log it and carry on: a failed notification
 * must never stop someone joining a game.
 */

type Payload = { title: string; body: string; url: string };

let configured = false;

function configure(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    console.warn("[push] VAPID keys not set — notifications are switched off");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function send(rows: SubscriptionRow[], payload: Payload): Promise<void> {
  const body = JSON.stringify(payload);
  const dead: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the browser threw the subscription away (app deleted,
        // notifications turned off). Tidy it up rather than retrying forever.
        if (status === 404 || status === 410) {
          dead.push(row.id);
        } else {
          console.error("[push] send failed", status, (error as Error).message);
        }
      }
    }),
  );

  if (dead.length) {
    await db().from("push_subscriptions").delete().in("id", dead);
    console.log(`[push] removed ${dead.length} expired subscription(s)`);
  }
}

/** Notify specific people. Anyone without notifications on is simply skipped. */
export async function notifyMembers(
  memberIds: (string | null)[],
  payload: Payload,
): Promise<void> {
  const ids = [...new Set(memberIds.filter((id): id is string => !!id))];
  if (!ids.length || !configure()) return;

  const { data, error } = await db()
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("member_id", ids);

  if (error) {
    console.error("[push] could not load subscriptions", error.message);
    return;
  }
  await send(data as SubscriptionRow[], payload);
}

/** Notify the whole group — used when a new game is created. */
export async function notifyEveryone(
  payload: Payload,
  exceptMemberId?: string,
): Promise<void> {
  if (!configure()) return;

  let query = db()
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, member_id");

  if (exceptMemberId) query = query.neq("member_id", exceptMemberId);

  const { data, error } = await query;
  if (error) {
    console.error("[push] could not load subscriptions", error.message);
    return;
  }
  await send(data as SubscriptionRow[], payload);
}
