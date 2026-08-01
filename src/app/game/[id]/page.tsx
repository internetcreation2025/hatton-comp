import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import Slots from "@/components/Slots";
import JoinLeaveButton from "@/components/JoinLeaveButton";
import AddGuestForm from "@/components/AddGuestForm";
import ShareButton from "@/components/ShareButton";
import CancelGameButton from "@/components/CancelGameButton";
import { removePlayerFromGame } from "@/app/actions";
import { getCurrentMember } from "@/lib/auth";
import { getGame, getGameEvents } from "@/lib/games";
import {
  durationMinutes,
  formatClock,
  formatDayLabel,
  formatShortDate,
  formatTime,
  formatTimeRange,
} from "@/lib/time";
import type { GameWithPlayers } from "@/lib/types";

export const dynamic = "force-dynamic";

/** The message that gets pasted into WhatsApp. */
function shareSummary(game: GameWithPlayers): string {
  const lines = [
    `Padel — ${formatShortDate(game.starts_at)}, ${formatTimeRange(game.starts_at, game.ends_at)}`,
    game.court ? `${game.venue} · Court ${game.court}` : game.venue,
    "",
  ];

  for (let i = 0; i < game.capacity; i++) {
    lines.push(`${i + 1}. ${game.players[i]?.name ?? "—"}`);
  }

  lines.push("");
  lines.push(
    game.spotsLeft === 0
      ? "That's four — game on."
      : `${game.spotsLeft} ${game.spotsLeft === 1 ? "spot" : "spots"} left:`,
  );

  return lines.join("\n");
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const events = await getGameEvents(id);

  const cancelled = game.status === "cancelled";
  const finished = new Date(game.ends_at) < new Date();
  const canManage = member.is_admin || game.created_by === member.id;

  const mine = [...game.players, ...game.waitlist].find(
    (p) => p.member_id === member.id,
  );

  return (
    <AppShell
      title={formatDayLabel(game.starts_at)}
      back={{ href: finished ? "/past" : "/", label: finished ? "History" : "Upcoming" }}
      action={
        canManage && !cancelled && !finished ? (
          <Link
            href={`/game/${game.id}/edit`}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium"
          >
            Edit
          </Link>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        {cancelled && (
          <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[15px] font-medium text-danger">
            This game was cancelled. Don&apos;t turn up.
          </p>
        )}

        <section className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-2xl font-semibold tracking-tight">
            {formatTimeRange(game.starts_at, game.ends_at)}
          </p>
          <p className="mt-1 text-[15px] text-muted">
            {formatShortDate(game.starts_at)} ·{" "}
            {durationMinutes(game.starts_at, game.ends_at)} mins
          </p>
          <p className="mt-3 text-[15px]">
            {game.venue}
            {game.court && (
              <span className="text-muted"> · Court {game.court}</span>
            )}
          </p>
          {game.notes && (
            <p className="mt-3 whitespace-pre-wrap rounded-lg bg-surface-2 px-3 py-2.5 text-[15px] leading-relaxed">
              {game.notes}
            </p>
          )}
        </section>

        <section>
          <div className="mb-2.5 flex items-baseline justify-between px-0.5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">
              Players
            </h2>
            <span className="text-[13px] text-muted">
              {cancelled
                ? "—"
                : game.spotsLeft === 0
                  ? "Full"
                  : `${game.spotsLeft} needed`}
            </span>
          </div>

          <Slots
            players={game.players}
            capacity={game.capacity}
            cancelled={cancelled}
          />

          {/* Removing a guest, or an organiser taking someone out. */}
          {!cancelled && !finished && (
            <div className="mt-2 flex flex-col gap-1">
              {game.players
                .filter(
                  (p) =>
                    canManage ||
                    p.added_by === member.id ||
                    p.member_id === member.id,
                )
                .filter((p) => p.member_id !== member.id)
                .map((player) => (
                  <form key={player.id} action={removePlayerFromGame}>
                    <input type="hidden" name="gameId" value={game.id} />
                    <input type="hidden" name="playerId" value={player.id} />
                    <button
                      type="submit"
                      className="text-[13px] text-muted underline underline-offset-2"
                    >
                      Remove {player.name}
                    </button>
                  </form>
                ))}
            </div>
          )}
        </section>

        {game.waitlist.length > 0 && (
          <section>
            <h2 className="mb-2.5 px-0.5 text-[13px] font-semibold uppercase tracking-wider text-muted">
              Waiting
            </h2>
            <ul className="flex flex-col gap-1.5">
              {game.waitlist.map((player, index) => (
                <li
                  key={player.id}
                  className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-2.5 py-2"
                >
                  <span className="w-4 shrink-0 text-center text-[13px] text-muted">
                    {index + 1}
                  </span>
                  <Avatar
                    name={player.name}
                    colour={player.colour}
                    size={28}
                  />
                  <span className="truncate text-[15px]">{player.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!cancelled && !finished && (
          <section className="flex flex-col gap-2.5">
            <JoinLeaveButton
              gameId={game.id}
              state={
                mine
                  ? mine.status === "playing"
                    ? "playing"
                    : "waiting"
                  : "out"
              }
              full={game.spotsLeft === 0}
              startsAt={game.starts_at}
            />
            <ShareButton summary={shareSummary(game)} gameId={game.id} />
            <AddGuestForm gameId={game.id} />
          </section>
        )}

        <section>
          <h2 className="mb-2.5 px-0.5 text-[13px] font-semibold uppercase tracking-wider text-muted">
            What&apos;s happened
          </h2>
          <ol className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-3 text-[14px]"
              >
                <span className="text-ink">{event.detail ?? event.type}</span>
                <span className="shrink-0 text-[13px] text-muted">
                  {formatClock(event.created_at)}
                </span>
              </li>
            ))}
            {events.length === 0 && (
              <li className="text-[14px] text-muted">Nothing yet.</li>
            )}
          </ol>
        </section>

        {canManage && !cancelled && !finished && (
          <section className="pt-2">
            <CancelGameButton gameId={game.id} />
          </section>
        )}

        {finished && !cancelled && (
          <p className="text-center text-[14px] text-muted">
            This game finished at {formatTime(game.ends_at)}.
          </p>
        )}
      </div>
    </AppShell>
  );
}
