import Link from "next/link";
import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import GameCard from "@/components/GameCard";
import GamesFilter from "@/components/GamesFilter";
import NotificationsNudge from "@/components/NotificationsNudge";
import { getCurrentMember, touchMember } from "@/lib/auth";
import { getUpcomingGames } from "@/lib/games";
import { formatDayLabel, londonDateKey } from "@/lib/time";
import type { GameWithPlayers } from "@/lib/types";

// Always show the live picture — a cached games list is worse than useless.
export const dynamic = "force-dynamic";

export default async function UpcomingPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  await touchMember(member.id);

  const { show } = await searchParams;
  const filter = show === "mine" ? "mine" : "all";

  const all = await getUpcomingGames();
  const isMine = (game: GameWithPlayers) =>
    [...game.players, ...game.waitlist].some((p) => p.member_id === member.id);

  const mineCount = all.filter(isMine).length;
  const games = filter === "mine" ? all.filter(isMine) : all;

  // Group by London calendar day so the headings read "Today", "Tomorrow", etc.
  const days = new Map<string, GameWithPlayers[]>();
  for (const game of games) {
    const key = londonDateKey(game.starts_at);
    days.set(key, [...(days.get(key) ?? []), game]);
  }

  return (
    <AppShell
      title="Upcoming"
      action={
        <Link
          href="/new"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
        >
          New game
        </Link>
      }
    >
      <NotificationsNudge />

      {all.length > 0 && <GamesFilter active={filter} mineCount={mineCount} />}

      {games.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[17px] font-medium">
            {filter === "mine" ? "You're not in anything yet" : "Nothing booked in"}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
            {filter === "mine"
              ? "Switch to All games to see what the group has on."
              : "No games coming up. Set one up and everyone in the group gets a nudge."}
          </p>
          <Link
            href={filter === "mine" ? "/" : "/new"}
            className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink"
          >
            {filter === "mine" ? "See all games" : "Set up a game"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {[...days.entries()].map(([key, dayGames]) => (
            <section key={key}>
              <h2 className="mb-2.5 px-0.5 text-[13px] font-semibold uppercase tracking-wider text-muted">
                {formatDayLabel(dayGames[0].starts_at)}
              </h2>
              <div className="flex flex-col gap-3">
                {dayGames.map((game) => (
                  <GameCard key={game.id} game={game} memberId={member.id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
