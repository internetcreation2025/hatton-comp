import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import Slots from "@/components/Slots";
import JoinLeaveButton from "@/components/JoinLeaveButton";
import AddPlayers from "@/components/AddPlayers";
import ShareButton from "@/components/ShareButton";
import PostPrompt, { type Occasion } from "@/components/PostPrompt";
import CancelGameButton from "@/components/CancelGameButton";
import { removePlayerFromGame } from "@/app/actions";
import { getCurrentMember } from "@/lib/auth";
import { getGame, getGameEvents, getMembersNotInGame } from "@/lib/games";
import { shareMessage, spotsLine } from "@/lib/share";
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

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tell?: string }>;
};

/**
 * What WhatsApp reads when the link is pasted into the chat. Deliberately
 * available without signing in — otherwise the crawler gets a redirect and the
 * link shows up as a bare blue URL.
 */
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) return { title: "Game not found · Hatton Competitors" };

  const title = `${formatShortDate(game.starts_at)}, ${formatTimeRange(game.starts_at, game.ends_at)} · ${game.venue}`;

  return {
    title: `${title} · Hatton Competitors`,
    description: spotsLine(game),
    openGraph: {
      title,
      description: `${spotsLine(game)} — tap to see who's playing.`,
      type: "website" as const,
    },
  };
}

const TELL_OCCASIONS = new Set<Occasion>(["new", "full", "spot", "off", "needs"]);

function readOccasion(value: string | undefined): Occasion | null {
  return value && TELL_OCCASIONS.has(value as Occasion)
    ? (value as Occasion)
    : null;
}

/** What someone arriving from WhatsApp sees before they've joined. */
function SignedOutView({ game }: { game: GameWithPlayers }) {
  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Image
              src="/hatton-logo.jpg"
              alt="Hatton Sports Club"
              width={229}
              height={84}
              priority
              className="h-10 w-auto"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 text-center">
          <p className="text-[19px] font-semibold tracking-tight">
            {formatShortDate(game.starts_at)},{" "}
            {formatTimeRange(game.starts_at, game.ends_at)}
          </p>
          <p className="mt-1 text-[15px] text-muted">
            {game.venue}
            {game.court ? ` · Court ${game.court}` : ""}
          </p>
          <p className="mt-3 text-[15px] font-medium">{spotsLine(game)}</p>
        </div>

        <Link
          href={`/join?next=/game/${game.id}`}
          className="mt-5 block rounded-xl bg-accent px-4 py-3.5 text-center text-[16px] font-semibold text-accent-ink"
        >
          Add your name
        </Link>

        <p className="mt-3 text-center text-[13px] leading-relaxed text-muted">
          You&apos;ll need the group code once. After that this game opens
          straight away.
        </p>
      </div>
    </main>
  );
}

export default async function GamePage({ params, searchParams }: Props) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  // Anyone tapping the link in WhatsApp lands here. Show them the game and a
  // way in, rather than dumping them on the front door.
  const member = await getCurrentMember();
  if (!member) return <SignedOutView game={game} />;

  const { tell } = await searchParams;
  const occasion = readOccasion(tell);
  const [events, notInGame] = await Promise.all([
    getGameEvents(id),
    getMembersNotInGame(id),
  ]);

  const candidates = notInGame.map((m) => ({
    id: m.id,
    display_name: m.display_name,
    colour: m.colour,
  }));

  const cancelled = game.status === "cancelled";
  const finished = new Date(game.ends_at) < new Date();
  const canManage = member.is_admin || game.created_by === member.id;

  const mine = [...game.players, ...game.waitlist].find(
    (p) => p.member_id === member.id,
  );

  return (
    <AppShell
      title={formatDayLabel(game.starts_at)}
      back={{
        href: finished ? "/past" : "/",
        label: finished ? "History" : "Upcoming",
      }}
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
        {occasion && (
          <PostPrompt
            occasion={occasion}
            message={shareMessage(game)}
            gameId={game.id}
          />
        )}

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
                  <Avatar name={player.name} colour={player.colour} size={28} />
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
            <AddPlayers
              gameId={game.id}
              candidates={candidates}
              full={game.spotsLeft === 0}
            />
            {!occasion && (
              <ShareButton message={shareMessage(game)} gameId={game.id} />
            )}
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
