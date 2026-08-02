import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import GameCard from "@/components/GameCard";
import { getCurrentMember } from "@/lib/auth";
import { getPastGames } from "@/lib/games";
import { formatShortDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "History · Hatton Competitors" };

export default async function PastPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const games = await getPastGames();

  return (
    <AppShell title="History">
      {games.length === 0 ? (
        <p className="mt-16 text-center text-[15px] text-muted">
          No games have been played yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {games.map((game) => (
            <div key={game.id}>
              <p className="mb-1.5 px-0.5 text-[13px] font-semibold uppercase tracking-wider text-muted">
                {formatShortDate(game.starts_at)}
              </p>
              <GameCard game={game} memberId={member.id} readOnly />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
