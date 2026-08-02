import Link from "next/link";
import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import GameCard from "@/components/GameCard";
import { getCurrentMember } from "@/lib/auth";
import { getGamesInRange } from "@/lib/games";
import {
  currentLondonMonth,
  formatDateKeyLong,
  formatMonthLabel,
  londonDateKey,
  londonMonthRange,
  monthGrid,
  shiftMonth,
} from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar · Hatton Competitors" };

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; d?: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const { m, d } = await searchParams;
  const month = m && MONTH_PATTERN.test(m) ? m : currentLondonMonth();
  const selected = d && DAY_PATTERN.test(d) ? d : null;

  const { from, to } = londonMonthRange(month);
  const games = await getGamesInRange(from, to);

  // Which days have something on, and how many.
  const byDay = new Map<string, number>();
  for (const game of games) {
    const key = londonDateKey(game.starts_at);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  const today = londonDateKey(new Date().toISOString());
  const grid = monthGrid(month);
  const selectedGames = selected
    ? games.filter((g) => londonDateKey(g.starts_at) === selected)
    : [];

  return (
    <AppShell title="Calendar">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/past?m=${shiftMonth(month, -1)}`}
          aria-label="Previous month"
          className="rounded-lg border border-line px-3 py-2 text-muted"
        >
          <Arrow direction="left" />
        </Link>

        <p className="text-[16px] font-semibold tracking-tight">
          {formatMonthLabel(month)}
        </p>

        <Link
          href={`/past?m=${shiftMonth(month, 1)}`}
          aria-label="Next month"
          className="rounded-lg border border-line px-3 py-2 text-muted"
        >
          <Arrow direction="right" />
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="mb-1 grid grid-cols-7">
          {WEEKDAYS.map((day, index) => (
            <div
              key={index}
              className="py-1 text-center text-[11px] font-semibold uppercase text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((dateKey) => {
            const inMonth = dateKey.startsWith(month);
            const count = byDay.get(dateKey) ?? 0;
            const isToday = dateKey === today;
            const isSelected = dateKey === selected;
            const dayNumber = Number(dateKey.slice(8));

            if (count === 0) {
              return (
                <div
                  key={dateKey}
                  className={`flex aspect-square items-center justify-center rounded-lg text-[14px] ${
                    inMonth ? "text-muted" : "text-muted/35"
                  } ${isToday ? "ring-1 ring-inset ring-line" : ""}`}
                >
                  {dayNumber}
                </div>
              );
            }

            return (
              <Link
                key={dateKey}
                href={`/past?m=${month}&d=${dateKey}`}
                aria-label={`${formatDateKeyLong(dateKey)}, ${count} game${count === 1 ? "" : "s"}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[14px] font-semibold ${
                  isSelected
                    ? "bg-accent text-accent-ink"
                    : "bg-accent/15 text-ink ring-1 ring-inset ring-accent/40"
                }`}
              >
                {dayNumber}
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${
                    isSelected ? "bg-accent-ink" : "bg-accent"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {games.length === 0 && (
        <p className="mt-6 text-center text-[15px] text-muted">
          No games in {formatMonthLabel(month)}.
        </p>
      )}

      {selected && (
        <section className="mt-6">
          <h2 className="mb-2.5 px-0.5 text-[13px] font-semibold uppercase tracking-wider text-muted">
            {formatDateKeyLong(selected)}
          </h2>
          {selectedGames.length === 0 ? (
            <p className="text-[15px] text-muted">Nothing on that day.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  memberId={member.id}
                  readOnly={new Date(game.ends_at) < new Date()}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {!selected && games.length > 0 && (
        <p className="mt-6 text-center text-[14px] text-muted">
          Tap a highlighted day to see what was on.
        </p>
      )}
    </AppShell>
  );
}
