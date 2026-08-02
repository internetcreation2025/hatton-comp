import "server-only";
import { db } from "./db";
import type {
  Game,
  GameEvent,
  GameEventType,
  GamePlayer,
  GameWithPlayers,
  Member,
  ResolvedPlayer,
} from "./types";

/** Turn raw player rows into rows that know the person's name and colour. */
function resolve(players: GamePlayer[], members: Map<string, Member>) {
  return players
    .map((p): ResolvedPlayer => {
      const member = p.member_id ? members.get(p.member_id) : undefined;
      return {
        ...p,
        name: member?.display_name ?? p.guest_name ?? "Unknown",
        colour: member?.colour ?? "slate",
        isGuest: !p.member_id,
      };
    })
    .sort((a, b) => a.position - b.position);
}

/** Attach players to a set of games in one go (no N+1 queries). */
async function withPlayers(games: Game[]): Promise<GameWithPlayers[]> {
  if (games.length === 0) return [];

  const gameIds = games.map((g) => g.id);

  const [playersResult, membersResult] = await Promise.all([
    db().from("game_players").select("*").in("game_id", gameIds),
    db().from("members").select("*"),
  ]);

  if (playersResult.error) throw new Error(playersResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const members = new Map(
    (membersResult.data as Member[]).map((m) => [m.id, m]),
  );
  const allPlayers = playersResult.data as GamePlayer[];

  return games.map((game) => {
    const forGame = allPlayers.filter((p) => p.game_id === game.id);
    const players = resolve(
      forGame.filter((p) => p.status === "playing"),
      members,
    );
    const waitlist = resolve(
      forGame.filter((p) => p.status === "waitlist"),
      members,
    );
    return {
      ...game,
      players,
      waitlist,
      spotsLeft: Math.max(0, game.capacity - players.length),
    };
  });
}

/** Games that haven't finished yet, soonest first. */
export async function getUpcomingGames(): Promise<GameWithPlayers[]> {
  const { data, error } = await db()
    .from("games")
    .select("*")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw new Error(error.message);
  return withPlayers(data as Game[]);
}

/** Games that have finished, most recent first. */
export async function getPastGames(limit = 50): Promise<GameWithPlayers[]> {
  const { data, error } = await db()
    .from("games")
    .select("*")
    .lt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return withPlayers(data as Game[]);
}

export async function getGame(id: string): Promise<GameWithPlayers | null> {
  const { data, error } = await db()
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [game] = await withPlayers([data as Game]);
  return game;
}

/** The plain-English "who did what" list for one game. */
export async function getGameEvents(
  gameId: string,
): Promise<Array<GameEvent & { actorName: string }>> {
  const [eventsResult, membersResult] = await Promise.all([
    db()
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true }),
    db().from("members").select("id, display_name"),
  ]);

  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const names = new Map(
    (membersResult.data as Pick<Member, "id" | "display_name">[]).map((m) => [
      m.id,
      m.display_name,
    ]),
  );

  return (eventsResult.data as GameEvent[]).map((event) => ({
    ...event,
    actorName: event.actor_member_id
      ? (names.get(event.actor_member_id) ?? "Someone")
      : "Someone",
  }));
}

/** Venues people have actually used, most recent first — for the quick-pick list. */
export async function getRecentVenues(): Promise<string[]> {
  const { data, error } = await db()
    .from("games")
    .select("venue")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);

  const seen = new Set<string>(["Hatton"]);
  for (const row of data as { venue: string }[]) seen.add(row.venue);
  return [...seen].slice(0, 8);
}

/**
 * Hatton has one court, so games there can't run at the same time. The database
 * enforces this properly; this exists so people get a sentence that explains
 * what's in the way rather than a bare error.
 */
export async function findHattonClash(
  venue: string,
  startsAt: string,
  endsAt: string,
  excludeGameId?: string,
): Promise<Game | null> {
  if (venue.trim().toLowerCase() !== "hatton") return null;

  let query = db()
    .from("games")
    .select("*")
    .ilike("venue", "hatton")
    .neq("status", "cancelled")
    // Two ranges overlap when each starts before the other ends.
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  if (excludeGameId) query = query.neq("id", excludeGameId);

  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);

  const rows = data as Game[];
  return rows.length ? rows[0] : null;
}

/**
 * Everyone in the group who isn't already in this game — the list you pick from
 * when someone says "put me down" in the chat.
 */
export async function getMembersNotInGame(gameId: string): Promise<Member[]> {
  const [membersResult, playersResult] = await Promise.all([
    db().from("members").select("*").order("display_name"),
    db().from("game_players").select("member_id").eq("game_id", gameId),
  ]);

  if (membersResult.error) throw new Error(membersResult.error.message);
  if (playersResult.error) throw new Error(playersResult.error.message);

  const taken = new Set(
    (playersResult.data as { member_id: string | null }[])
      .map((p) => p.member_id)
      .filter(Boolean),
  );

  return (membersResult.data as Member[]).filter((m) => !taken.has(m.id));
}

export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await db()
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Member) ?? null;
}

export async function logEvent(
  gameId: string,
  actorId: string | null,
  type: GameEventType,
  detail?: string,
): Promise<void> {
  const { error } = await db()
    .from("game_events")
    .insert({
      game_id: gameId,
      actor_member_id: actorId,
      type,
      detail: detail ?? null,
    });

  if (error) console.error("[games] failed to log event", error.message);
}

/** Next free slot number for a game, so slots stay in a sensible order. */
async function nextPosition(
  gameId: string,
  status: "playing" | "waitlist",
): Promise<number> {
  const { data, error } = await db()
    .from("game_players")
    .select("position")
    .eq("game_id", gameId)
    .eq("status", status)
    .order("position", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const rows = data as { position: number }[];
  return rows.length ? rows[0].position + 1 : 1;
}

export type AddResult = { outcome: "playing" | "waitlist" };

/**
 * Put someone in a game. If the four slots are already taken — including the
 * case where somebody else grabbed the last one a split second earlier — they
 * land on the waitlist instead of being turned away.
 */
export async function addPlayer(
  gameId: string,
  actorId: string,
  who: { memberId: string } | { guestName: string },
): Promise<AddResult> {
  const base = {
    game_id: gameId,
    added_by: actorId,
    member_id: "memberId" in who ? who.memberId : null,
    guest_name: "guestName" in who ? who.guestName.trim() : null,
  };

  const position = await nextPosition(gameId, "playing");
  const { error } = await db()
    .from("game_players")
    .insert({ ...base, status: "playing", position });

  if (!error) return { outcome: "playing" };

  // Double-tap, or two tabs at once. They're already in — nothing to do.
  if (error.code === "23505") {
    console.log("[games] player already in this game, ignoring");
    return { outcome: "playing" };
  }

  // The database refused because the game is full — go on the waitlist instead.
  if (error.message.includes("GAME_FULL")) {
    const waitPosition = await nextPosition(gameId, "waitlist");
    const { error: waitError } = await db()
      .from("game_players")
      .insert({ ...base, status: "waitlist", position: waitPosition });

    if (waitError && waitError.code !== "23505") {
      throw new Error(waitError.message);
    }
    return { outcome: "waitlist" };
  }

  throw new Error(error.message);
}

/**
 * Take someone out of a game, then move the first person off the waitlist into
 * the free slot. Returns whoever got promoted, so they can be notified.
 */
export async function removePlayer(
  gameId: string,
  playerId: string,
): Promise<{ promoted: ResolvedPlayer | null }> {
  const { error } = await db()
    .from("game_players")
    .delete()
    .eq("id", playerId)
    .eq("game_id", gameId);

  if (error) throw new Error(error.message);

  return { promoted: await promoteFromWaitlist(gameId) };
}

/** Move the longest-waiting person into a free slot, if there is one. */
export async function promoteFromWaitlist(
  gameId: string,
): Promise<ResolvedPlayer | null> {
  const game = await getGame(gameId);
  if (!game || game.status === "cancelled") return null;
  if (game.spotsLeft <= 0 || game.waitlist.length === 0) return null;

  const next = game.waitlist[0];
  const position = await nextPosition(gameId, "playing");

  const { error } = await db()
    .from("game_players")
    .update({ status: "playing", position })
    .eq("id", next.id);

  if (error) {
    // Almost certainly means the slot went in the meantime. Leave them waiting.
    console.error("[games] promotion failed", error.message);
    return null;
  }

  await logEvent(
    gameId,
    next.member_id,
    "promoted",
    `${next.name} moved off the waitlist into the game`,
  );
  return next;
}
