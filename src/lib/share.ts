import {
  formatShortDate,
  formatTime,
  formatTimeRange,
} from "./time";
import type { GameWithPlayers } from "./types";

/** One line summarising where a game stands. Used in previews and messages. */
export function spotsLine(game: GameWithPlayers): string {
  if (game.status === "cancelled") return "Cancelled";
  if (game.spotsLeft === 0) return "That's four — game on";
  return `${game.spotsLeft} ${game.spotsLeft === 1 ? "spot" : "spots"} left`;
}

/** "Tue 4 Aug · 5:00pm – 6:30pm · Hatton" */
export function gameHeadline(game: GameWithPlayers): string {
  const where = game.court ? `${game.venue}, court ${game.court}` : game.venue;
  return `${formatShortDate(game.starts_at)} · ${formatTimeRange(game.starts_at, game.ends_at)} · ${where}`;
}

/** The message that gets pasted into WhatsApp. */
export function shareMessage(game: GameWithPlayers): string {
  const lines = [
    `Padel — ${formatShortDate(game.starts_at)}, ${formatTimeRange(game.starts_at, game.ends_at)}`,
    game.court ? `${game.venue} · Court ${game.court}` : game.venue,
    "",
  ];

  for (let i = 0; i < game.capacity; i++) {
    lines.push(`${i + 1}. ${game.players[i]?.name ?? "—"}`);
  }

  if (game.waitlist.length > 0) {
    lines.push("");
    lines.push(`Waiting: ${game.waitlist.map((p) => p.name).join(", ")}`);
  }

  lines.push("");
  lines.push(
    game.status === "cancelled"
      ? `This game is OFF — ${formatTime(game.starts_at)} at ${game.venue} is cancelled.`
      : game.spotsLeft === 0
        ? "That's four — game on."
        : `${game.spotsLeft} ${game.spotsLeft === 1 ? "spot" : "spots"} left:`,
  );

  return lines.join("\n");
}
