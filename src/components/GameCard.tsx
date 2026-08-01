import Link from "next/link";
import Slots from "./Slots";
import JoinLeaveButton from "./JoinLeaveButton";
import { formatTimeRange } from "@/lib/time";
import type { GameWithPlayers } from "@/lib/types";

export default function GameCard({
  game,
  memberId,
  readOnly = false,
}: {
  game: GameWithPlayers;
  memberId: string;
  readOnly?: boolean;
}) {
  const cancelled = game.status === "cancelled";
  const mine = [...game.players, ...game.waitlist].find(
    (p) => p.member_id === memberId,
  );

  return (
    <article
      className={`rounded-2xl border border-line bg-surface p-4 ${
        cancelled ? "opacity-70" : ""
      }`}
    >
      <Link href={`/game/${game.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-[17px] font-semibold tracking-tight ${
                cancelled ? "text-muted line-through" : ""
              }`}
            >
              {formatTimeRange(game.starts_at, game.ends_at)}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted">
              {game.venue}
              {game.court ? ` · Court ${game.court}` : ""}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              cancelled
                ? "bg-surface-2 text-muted"
                : game.spotsLeft === 0
                  ? "bg-accent text-accent-ink"
                  : "border border-line text-muted"
            }`}
          >
            {cancelled
              ? "Cancelled"
              : game.spotsLeft === 0
                ? "Game on"
                : `${game.spotsLeft} needed`}
          </span>
        </div>
      </Link>

      <div className="mt-3">
        <Slots
          players={game.players}
          capacity={game.capacity}
          cancelled={cancelled}
        />
      </div>

      {game.waitlist.length > 0 && !cancelled && (
        <p className="mt-2 text-[13px] text-muted">
          Waiting: {game.waitlist.map((p) => p.name).join(", ")}
        </p>
      )}

      {!readOnly && !cancelled && (
        <div className="mt-3">
          <JoinLeaveButton
            gameId={game.id}
            state={
              mine ? (mine.status === "playing" ? "playing" : "waiting") : "out"
            }
            full={game.spotsLeft === 0}
            startsAt={game.starts_at}
          />
        </div>
      )}
    </article>
  );
}
