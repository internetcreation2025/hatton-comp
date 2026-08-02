import { redirect } from "next/navigation";

import { getCurrentMember } from "@/lib/auth";
import { buildIcs } from "@/lib/calendar";
import { getGame } from "@/lib/games";
import { siteUrl } from "@/lib/site";

/**
 * The calendar file for one game. Tapping this on a phone hands the event
 * straight to Apple Calendar; on a computer it downloads and opens in whatever
 * calendar they use.
 *
 * Behind the group code like everything else — the file lists who's playing.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  console.log("[calendar.ics] start —", id);

  const member = await getCurrentMember();
  if (!member) redirect(`/join?next=/game/${id}`);

  const game = await getGame(id);
  if (!game) return new Response("Not found", { status: 404 });

  const body = buildIcs(game, `${siteUrl()}/game/${game.id}`);

  console.log("[calendar.ics] done —", id);
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      // A name they'll recognise if it lands in their downloads folder.
      "content-disposition": 'attachment; filename="padel.ics"',
      "cache-control": "no-store",
    },
  });
}
