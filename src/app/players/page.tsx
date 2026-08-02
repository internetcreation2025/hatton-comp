import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import PlayerRow, { type DirectoryEntry } from "@/components/PlayerRow";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Players · Hatton Competitors" };

export default async function PlayersPage() {
  const me = await getCurrentMember();
  if (!me) redirect("/join");

  const [membersResult, playedResult] = await Promise.all([
    db()
      .from("members")
      .select("*")
      .is("removed_at", null)
      .order("display_name"),
    db().from("game_players").select("member_id").eq("status", "playing"),
  ]);

  if (membersResult.error) throw new Error(membersResult.error.message);
  if (playedResult.error) throw new Error(playedResult.error.message);

  const counts = new Map<string, number>();
  for (const row of playedResult.data as { member_id: string | null }[]) {
    if (row.member_id) {
      counts.set(row.member_id, (counts.get(row.member_id) ?? 0) + 1);
    }
  }

  const entries: DirectoryEntry[] = (membersResult.data as Member[]).map(
    (m) => ({
      id: m.id,
      display_name: m.display_name,
      colour: m.colour,
      phone: m.phone,
      is_admin: m.is_admin,
      gamesPlayed: counts.get(m.id) ?? 0,
    }),
  );

  const withNumbers = entries.filter((e) => e.phone).length;

  return (
    <AppShell title="Players">
      <p className="mb-4 px-0.5 text-[14px] leading-relaxed text-muted">
        {entries.length} in the group · {withNumbers} with a number.
        {me.is_admin && withNumbers < entries.length && (
          <> As organiser you can fill in anyone&apos;s.</>
        )}
      </p>

      <ul className="flex flex-col gap-2.5">
        {entries.map((entry) => (
          <PlayerRow
            key={entry.id}
            entry={entry}
            isYou={entry.id === me.id}
            canEdit={me.is_admin || entry.id === me.id}
            canManage={me.is_admin && entry.id !== me.id}
          />
        ))}
      </ul>

      <p className="mt-6 px-0.5 text-[13px] leading-relaxed text-muted">
        Numbers are optional and only visible to people who have the group code.
        Leave the box blank to remove yours at any time.
      </p>

      {me.is_admin && (
        <p className="mt-3 px-0.5 text-[13px] leading-relaxed text-muted">
          Organisers can edit or cancel any game, fill in anyone&apos;s number,
          remove people from the group, and make other organisers. Removing
          someone takes them out of the list and any games still to come — games
          they&apos;ve already played keep their name.
        </p>
      )}
    </AppShell>
  );
}
