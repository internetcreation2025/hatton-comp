"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { COLOURS, isGroupCodeCorrect, requireMember } from "@/lib/auth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";
import {
  addPlayer,
  findHattonClash,
  getGame,
  getMember,
  logEvent,
  removePlayer as removePlayerRow,
} from "@/lib/games";
import { notifyEveryone, notifyMembers } from "@/lib/push";
import { safeNext } from "@/lib/next-url";
import { formatShortDate, formatTime, londonToUtc } from "@/lib/time";
import type { GameWithPlayers, Member } from "@/lib/types";

export type FormState = {
  error?: string;
  ok?: boolean;
  /** Set when the name typed is already in the group and we need to check. */
  clash?: string;
};

/* -------------------------------------------------------------------------- */
/* Joining the group                                                          */
/* -------------------------------------------------------------------------- */

export async function joinGroup(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  console.log("[joinGroup] start");

  const code = String(formData.get("code") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!isGroupCodeCorrect(code)) {
    return { error: "That code isn't right. Check the message in the group." };
  }
  if (name.length < 2) {
    return { error: "Please enter your name (at least 2 characters)." };
  }
  if (name.length > 40) {
    return { error: "That name is too long." };
  }

  const { data: existing, error: lookupError } = await db()
    .from("members")
    .select("*")
    .ilike("display_name", name)
    .maybeSingle();

  if (lookupError) {
    console.error("[joinGroup] lookup failed", lookupError.message);
    return { error: "Something went wrong. Please try again." };
  }

  let member = existing as Member | null;

  // Picking a name that already exists usually means "that's me" on a new
  // phone — but it could equally be a second Neil. Signing them into someone
  // else's account by accident is the worst outcome, so ask.
  if (member && formData.get("confirm") !== "yes") {
    console.log("[joinGroup] name already in the group —", member.display_name);
    return { clash: member.display_name };
  }

  if (!member) {
    const { count } = await db()
      .from("members")
      .select("id", { count: "exact", head: true });

    const colour = COLOURS[(count ?? 0) % COLOURS.length];

    const { data: created, error: createError } = await db()
      .from("members")
      .insert({ display_name: name, colour })
      .select("*")
      .single();

    if (createError) {
      // Someone with that name registered a moment ago.
      if (createError.code === "23505") {
        return {
          error:
            "Someone just joined with that name. Add your surname or an initial and try again.",
        };
      }
      console.error("[joinGroup] create failed", createError.message);
      return { error: "Something went wrong. Please try again." };
    }
    member = created as Member;
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(member.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  console.log("[joinGroup] done —", member.display_name);
  // Somebody who tapped a game link in WhatsApp goes straight to that game.
  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/join");
}

export async function updateName(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2 || name.length > 40) {
    return { error: "Please enter a name between 2 and 40 characters." };
  }

  const { error } = await db()
    .from("members")
    .update({ display_name: name })
    .eq("id", member.id);

  if (error) {
    if (error.message.includes("members_display_name_lower_idx")) {
      return { error: "Someone in the group is already using that name." };
    }
    console.error("[updateName] failed", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Creating and editing games                                                 */
/* -------------------------------------------------------------------------- */

function readGameForm(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const minutes = Number(formData.get("duration") ?? 90);
  const venue = String(formData.get("venue") ?? "").trim() || "Hatton";
  const court = String(formData.get("court") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date || !time) return { error: "Please pick a date and a time." as const };
  if (!Number.isFinite(minutes) || minutes < 30 || minutes > 300) {
    return { error: "Please choose a length between 30 and 300 minutes." as const };
  }
  if (venue.length > 60) return { error: "That venue name is too long." as const };

  const startsAt = londonToUtc(date, time);
  const endsAt = new Date(startsAt.getTime() + minutes * 60000);

  return {
    values: {
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      venue,
      court: court || null,
      notes: notes || null,
    },
  };
}

/** The message shown when a Hatton game would run over another one. */
function clashMessage(clash: { starts_at: string; ends_at: string }): string {
  return `There's already a game at Hatton from ${formatTime(clash.starts_at)} to ${formatTime(clash.ends_at)} that day. Hatton only has one court, so games can't overlap.`;
}

export async function createGame(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  console.log("[createGame] start");
  const member = await requireMember();

  const parsed = readGameForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const clash = await findHattonClash(
    parsed.values.venue,
    parsed.values.starts_at,
    parsed.values.ends_at,
  );
  if (clash) return { error: clashMessage(clash) };

  const { data, error } = await db()
    .from("games")
    .insert({ ...parsed.values, created_by: member.id })
    .select("*")
    .single();

  if (error) {
    // Someone booked the same Hatton slot a split second earlier.
    if (error.code === "23P01") {
      return {
        error:
          "Someone just booked that Hatton slot. Pick another time and try again.",
      };
    }
    console.error("[createGame] failed", error.message);
    return { error: "Couldn't create that game. Please try again." };
  }

  const game = data as { id: string; starts_at: string; venue: string };

  await logEvent(game.id, member.id, "created", `${member.display_name} created this game`);

  // Whoever creates the game usually plays in it, but not always.
  if (formData.get("playing") === "on") {
    await addPlayer(game.id, member.id, { memberId: member.id });
  }

  await notifyEveryone(
    {
      title: `New game — ${formatShortDate(game.starts_at)}`,
      body: `${member.display_name} set up a game at ${game.venue}, ${formatTime(game.starts_at)}. Tap to grab a spot.`,
      url: `/game/${game.id}`,
    },
    member.id,
  );

  console.log("[createGame] done —", game.id);
  revalidatePath("/");
  // Land on the game with the "tell the group" prompt up, while the phone is
  // still in their hand.
  redirect(`/game/${game.id}?tell=new`);
}

export async function editGame(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  console.log("[editGame] start");
  const member = await requireMember();
  const gameId = String(formData.get("gameId") ?? "");

  const game = await getGame(gameId);
  if (!game) return { error: "That game no longer exists." };
  if (game.created_by !== member.id && !member.is_admin) {
    return { error: "Only the person who created this game can edit it." };
  }

  const parsed = readGameForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const timeChanged = parsed.values.starts_at !== game.starts_at;
  const venueChanged = parsed.values.venue !== game.venue;

  const clash = await findHattonClash(
    parsed.values.venue,
    parsed.values.starts_at,
    parsed.values.ends_at,
    gameId,
  );
  if (clash) return { error: clashMessage(clash) };

  const { error } = await db()
    .from("games")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", gameId);

  if (error) {
    if (error.code === "23P01") {
      return {
        error:
          "Someone just booked that Hatton slot. Pick another time and try again.",
      };
    }
    console.error("[editGame] failed", error.message);
    return { error: "Couldn't save those changes. Please try again." };
  }

  await logEvent(
    gameId,
    member.id,
    "edited",
    `${member.display_name} updated the details`,
  );

  if (timeChanged || venueChanged) {
    await notifyMembers(
      [...game.players, ...game.waitlist].map((p) => p.member_id),
      {
        title: "Game details changed",
        body: `${formatShortDate(parsed.values.starts_at)} at ${parsed.values.venue}, ${formatTime(parsed.values.starts_at)}.`,
        url: `/game/${gameId}`,
      },
    );
  }

  console.log("[editGame] done —", gameId);
  revalidatePath("/");
  redirect(`/game/${gameId}`);
}

export async function cancelGame(formData: FormData): Promise<void> {
  console.log("[cancelGame] start");
  const member = await requireMember();
  const gameId = String(formData.get("gameId") ?? "");

  const game = await getGame(gameId);
  if (!game) return;
  if (game.created_by !== member.id && !member.is_admin) return;

  const { error } = await db()
    .from("games")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", gameId);

  if (error) {
    console.error("[cancelGame] failed", error.message);
    return;
  }

  await logEvent(
    gameId,
    member.id,
    "cancelled",
    `${member.display_name} cancelled this game`,
  );

  await notifyMembers(
    [...game.players, ...game.waitlist].map((p) => p.member_id),
    {
      title: "Game cancelled",
      body: `${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue} is off.`,
      url: `/game/${gameId}`,
    },
  );

  console.log("[cancelGame] done —", gameId);
  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);
  redirect(`/game/${gameId}?tell=off`);
}

/* -------------------------------------------------------------------------- */
/* Joining and leaving games                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Tell everyone already involved in a game that the line-up changed — except
 * whoever made the change, who is looking at it, and anyone named separately.
 */
async function notifyOthersInGame(
  game: GameWithPlayers,
  exclude: (string | null)[],
  payload: { title: string; body: string },
): Promise<void> {
  const skip = new Set(exclude.filter(Boolean));
  const audience = [...game.players, ...game.waitlist]
    .map((p) => p.member_id)
    .filter((id): id is string => Boolean(id) && !skip.has(id));

  await notifyMembers(audience, { ...payload, url: `/game/${game.id}` });
}

export async function joinGame(formData: FormData): Promise<void> {
  console.log("[joinGame] start");
  const member = await requireMember();
  const gameId = String(formData.get("gameId") ?? "");

  const game = await getGame(gameId);
  if (!game || game.status === "cancelled") return;

  const already = [...game.players, ...game.waitlist].some(
    (p) => p.member_id === member.id,
  );
  if (already) return;

  const { outcome } = await addPlayer(gameId, member.id, {
    memberId: member.id,
  });

  await logEvent(
    gameId,
    member.id,
    "joined",
    outcome === "playing"
      ? `${member.display_name} joined`
      : `${member.display_name} joined the waitlist`,
  );

  // Announce a full game to the people actually playing in it.
  if (outcome === "playing" && game.spotsLeft === 1) {
    const updated = await getGame(gameId);
    await notifyMembers(updated?.players.map((p) => p.member_id) ?? [], {
      title: "Game on — that's four",
      body: `${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue} is full.`,
      url: `/game/${gameId}`,
    });
  }

  console.log("[joinGame] done —", outcome);
  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);

  // Whoever completes the four is best placed to tell the group it's on.
  if (outcome === "playing" && game.spotsLeft === 1) {
    redirect(`/game/${gameId}?tell=full`);
  }
}

export async function leaveGame(formData: FormData): Promise<void> {
  console.log("[leaveGame] start");
  const member = await requireMember();
  const gameId = String(formData.get("gameId") ?? "");

  const game = await getGame(gameId);
  if (!game) return;

  const me = [...game.players, ...game.waitlist].find(
    (p) => p.member_id === member.id,
  );
  if (!me) return;

  const wasPlaying = me.status === "playing";
  const { promoted } = await removePlayerRow(gameId, me.id);

  await logEvent(gameId, member.id, "left", `${member.display_name} dropped out`);

  if (wasPlaying) {
    if (promoted) {
      await notifyMembers([promoted.member_id], {
        title: "You're in",
        body: `A spot opened up — ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
        url: `/game/${gameId}`,
      });
    }

    await notifyOthersInGame(
      game,
      [member.id, promoted?.member_id ?? null],
      promoted
        ? {
            title: `${member.display_name} is out`,
            body: `${promoted.name} moves up into the spot for ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)}.`,
          }
        : {
            title: "A spot has opened up",
            body: `${member.display_name} dropped out of ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
          },
    );
  }

  console.log("[leaveGame] done");
  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);

  // A gap nobody on the waitlist could fill is worth putting in the chat.
  if (wasPlaying && !promoted && new Date(game.starts_at) > new Date()) {
    redirect(`/game/${gameId}?tell=spot`);
  }
}

export async function addGuest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  console.log("[addGuest] start");
  const member = await requireMember();
  const gameId = String(formData.get("gameId") ?? "");
  const guestName = String(formData.get("guestName") ?? "").trim();

  if (guestName.length < 2 || guestName.length > 40) {
    return { error: "Please enter the guest's name." };
  }

  const game = await getGame(gameId);
  if (!game || game.status === "cancelled") {
    return { error: "That game isn't taking players." };
  }

  const { outcome } = await addPlayer(gameId, member.id, { guestName });

  await logEvent(
    gameId,
    member.id,
    "guest_added",
    `${member.display_name} added ${guestName}${outcome === "waitlist" ? " to the waitlist" : ""}`,
  );

  await notifyOthersInGame(game, [member.id], {
    title: `${guestName} is in`,
    body: `${member.display_name} added them to ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
  });

  console.log("[addGuest] done —", outcome);
  revalidatePath(`/game/${gameId}`);
  revalidatePath("/");
  return { ok: true };
}

/**
 * Put someone else from the group into a game.
 *
 * Anyone can do this for anyone — it's how "put me down for Tuesday" in the
 * WhatsApp chat gets acted on. Every add is stamped with who did it, so it's
 * visible rather than prevented.
 */
export async function addMemberToGame(formData: FormData): Promise<void> {
  console.log("[addMemberToGame] start");
  const actor = await requireMember();
  const gameId = String(formData.get("gameId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");

  const game = await getGame(gameId);
  if (!game || game.status === "cancelled") return;

  const already = [...game.players, ...game.waitlist].some(
    (p) => p.member_id === memberId,
  );
  if (already) return;

  const target = await getMember(memberId);
  if (!target) return;

  const { outcome } = await addPlayer(gameId, actor.id, { memberId });

  await logEvent(
    gameId,
    actor.id,
    "joined",
    actor.id === memberId
      ? `${actor.display_name} joined`
      : `${actor.display_name} added ${target.display_name}${outcome === "waitlist" ? " to the waitlist" : ""}`,
  );

  // Being put in a game by someone else is exactly the sort of thing you want
  // to hear about.
  if (actor.id !== memberId) {
    await notifyMembers([memberId], {
      title:
        outcome === "playing"
          ? `${actor.display_name} put you in a game`
          : `${actor.display_name} put you on a waitlist`,
      body: `${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
      url: `/game/${gameId}`,
    });
  }

  // And everyone already in it should know who they're playing with.
  await notifyOthersInGame(game, [actor.id, memberId], {
    title: `${target.display_name} is in`,
    body: `${actor.display_name} added them to ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
  });

  if (outcome === "playing" && game.spotsLeft === 1) {
    const updated = await getGame(gameId);
    await notifyMembers(updated?.players.map((p) => p.member_id) ?? [], {
      title: "Game on — that's four",
      body: `${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue} is full.`,
      url: `/game/${gameId}`,
    });
  }

  console.log("[addMemberToGame] done —", outcome);
  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);
}

/** Used to take a guest out, or for an admin/organiser to remove anyone. */
export async function removePlayerFromGame(formData: FormData): Promise<void> {
  console.log("[removePlayerFromGame] start");
  const member = await requireMember();
  const gameId = String(formData.get("gameId") ?? "");
  const playerId = String(formData.get("playerId") ?? "");

  const game = await getGame(gameId);
  if (!game) return;

  const target = [...game.players, ...game.waitlist].find(
    (p) => p.id === playerId,
  );
  if (!target) return;

  const allowed =
    member.is_admin ||
    game.created_by === member.id ||
    target.added_by === member.id ||
    target.member_id === member.id;

  if (!allowed) {
    console.log("[removePlayerFromGame] not allowed");
    return;
  }

  const wasPlaying = target.status === "playing";
  const { promoted } = await removePlayerRow(gameId, playerId);

  await logEvent(
    gameId,
    member.id,
    target.isGuest ? "guest_removed" : "left",
    `${member.display_name} removed ${target.name}`,
  );

  if (wasPlaying && promoted) {
    await notifyMembers([promoted.member_id], {
      title: "You're in",
      body: `A spot opened up — ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
      url: `/game/${gameId}`,
    });
  }

  // Everyone left in the game should know the line-up changed.
  await notifyOthersInGame(
    game,
    [member.id, target.member_id, promoted?.member_id ?? null],
    {
      title: `${target.name} is out`,
      body: promoted
        ? `${promoted.name} moves up into the spot for ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)}.`
        : `${member.display_name} took them out of ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
    },
  );

  console.log("[removePlayerFromGame] done");
  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);
}
