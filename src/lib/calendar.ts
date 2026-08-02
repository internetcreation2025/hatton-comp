import { formatTimeRange } from "./time";
import type { GameWithPlayers } from "./types";

/**
 * Putting a game in somebody's own calendar.
 *
 * Three routes, because people are on different things: a downloadable .ics
 * file (iPhone, Mac, Outlook desktop, and most other calendars), and direct
 * links for Google Calendar and Outlook on the web.
 *
 * Deliberately no VALARM in the .ics — the app already pushes a reminder an
 * hour before, and a second alert at the same moment is just noise.
 */

/** "2026-08-04T16:00:00.000Z" -> "20260804T160000Z", the format iCalendar wants. */
function stamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Commas, semicolons, backslashes and newlines all mean something in iCalendar. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * iCalendar lines have to be wrapped, with continuations starting with a space.
 * Split by code point so an emoji or an accented name can never be cut in half.
 */
function fold(line: string): string {
  const chars = Array.from(line);
  if (chars.length <= 72) return line;

  const parts: string[] = [chars.slice(0, 72).join("")];
  for (let i = 72; i < chars.length; i += 71) {
    parts.push(" " + chars.slice(i, i + 71).join(""));
  }
  return parts.join("\r\n");
}

function title(game: GameWithPlayers): string {
  return `Padel — ${game.venue}`;
}

function location(game: GameWithPlayers): string {
  return game.court ? `${game.venue}, court ${game.court}` : game.venue;
}

function description(game: GameWithPlayers, url: string): string {
  const lines: string[] = [];

  const names = game.players.map((p) => p.name);
  lines.push(names.length ? `Playing: ${names.join(", ")}` : "Nobody in it yet.");

  if (game.notes) lines.push(game.notes);

  lines.push(`See who's playing: ${url}`);
  return lines.join("\n");
}

/**
 * The .ics file. Same UID every time, and a SEQUENCE that goes up whenever the
 * game is edited, so downloading it again after a time change updates the event
 * already in their calendar rather than adding a second one.
 */
export function buildIcs(game: GameWithPlayers, url: string): string {
  const sequence = Math.max(
    0,
    Math.floor(
      (new Date(game.updated_at).getTime() -
        new Date(game.created_at).getTime()) /
        1000,
    ),
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hatton Competitors//Padel//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${game.id}@hatton-competitors`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(game.starts_at)}`,
    `DTEND:${stamp(game.ends_at)}`,
    `SEQUENCE:${sequence}`,
    `SUMMARY:${escapeText(title(game))}`,
    `LOCATION:${escapeText(location(game))}`,
    `DESCRIPTION:${escapeText(description(game, url))}`,
    `URL:${escapeText(url)}`,
    `STATUS:${game.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // iCalendar is a CRLF format, and some clients are strict about it.
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** "Add to Google Calendar" — opens their calendar with the event filled in. */
export function googleCalendarUrl(
  game: GameWithPlayers,
  url: string,
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title(game),
    dates: `${stamp(game.starts_at)}/${stamp(game.ends_at)}`,
    details: description(game, url),
    location: location(game),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** The same thing for Outlook.com / Microsoft 365 on the web. */
export function outlookCalendarUrl(
  game: GameWithPlayers,
  url: string,
): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title(game),
    startdt: new Date(game.starts_at).toISOString(),
    enddt: new Date(game.ends_at).toISOString(),
    body: description(game, url),
    location: location(game),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** What the calendar entry will say, for the line under the button. */
export function calendarSummary(game: GameWithPlayers): string {
  return `${title(game)} · ${formatTimeRange(game.starts_at, game.ends_at)}`;
}
