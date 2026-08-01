/**
 * Everything to do with dates and times.
 *
 * Rule for this app: times are STORED in UTC and DISPLAYED in Europe/London.
 * Britain moves the clocks twice a year, so "5pm" in June and "5pm" in December
 * are different UTC instants. Doing this by hand is how apps end up telling
 * people the wrong kick-off time, so every conversion goes through here.
 */

export const TIME_ZONE = "Europe/London";

/** How far ahead of UTC London is at a given moment, in milliseconds. */
function londonOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asIfUtc - utcMs;
}

/**
 * Take what someone typed into the form ("2026-08-04" and "17:00", meaning
 * London time) and work out the actual UTC instant.
 */
export function londonToUtc(dateInput: string, timeInput: string): Date {
  const [year, month, day] = dateInput.split("-").map(Number);
  const [hour, minute] = timeInput.split(":").map(Number);

  const naive = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes: the first guess is nearly always right, the second catches the
  // couple of hours a year when the clocks change mid-calculation.
  let utcMs = naive - londonOffsetMs(naive);
  utcMs = naive - londonOffsetMs(utcMs);

  return new Date(utcMs);
}

/** The other direction — turn a stored instant back into form values. */
export function utcToLondonInputs(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

/** "5:00pm" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\s/g, "")
    .toLowerCase();
}

/** "5:00pm – 6:30pm" */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

/** The London calendar date of an instant, as "2026-08-04". Used for grouping. */
export function londonDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** "Today", "Tomorrow", or "Tuesday 4 August". */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const key = londonDateKey(iso);
  const todayKey = londonDateKey(now.toISOString());

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = londonDateKey(tomorrow.toISOString());

  if (key === todayKey) return "Today";
  if (key === tomorrowKey) return "Tomorrow";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

/** "Tue 4 Aug" — the compact version, for history and share messages. */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** "17:30" — used in the activity log. */
export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** How many minutes long a game is. */
export function durationMinutes(startIso: string, endIso: string): number {
  return Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
  );
}

/**
 * What the new-game form starts on: the next round hour. Taking the date from
 * the same instant as the time keeps it right late at night, when "an hour from
 * now" is already tomorrow.
 */
export function defaultGameStart(): { date: string; time: string } {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  const { date, time } = utcToLondonInputs(nextHour.toISOString());
  return { date, time: `${time.slice(0, 2)}:00` };
}

/** True if the game starts within the next 24 hours (used for the leaving warning). */
export function startsWithin24Hours(startIso: string): boolean {
  const ms = new Date(startIso).getTime() - Date.now();
  return ms > 0 && ms < 24 * 60 * 60 * 1000;
}
