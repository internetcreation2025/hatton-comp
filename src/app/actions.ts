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
  getGame,
  logEvent,
  removePlayer as removePlayerRow,
} from "@/lib/games";
import { notifyEveryone, notifyMembers } from "@/lib/push";
import { formatShortDate, formatTime, londonToUtc } from "@/lib/time";
import type { Member } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean };

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

  // Picking a name that already exists means "that's me" — this is how someone
  // signs in again on a new phone.
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
  redirect("/");
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

export async function createGame(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  console.log("[createGame] start");
  const member = await requireMember();

  const parsed = readGameForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await db()
    .from("games")
    .insert({ ...parsed.values, created_by: member.id })
    .select("*")
    .single();

  if (error) {
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
  redirect(`/game/${game.id}`);
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

  const { error } = await db()
    .from("games")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", gameId);

  if (error) {
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
}

/* -------------------------------------------------------------------------- */
/* Joining and leaving games                                                  */
/* -------------------------------------------------------------------------- */

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
    } else {
      const remaining = await getGame(gameId);
      await notifyMembers(remaining?.players.map((p) => p.member_id) ?? [], {
        title: "A spot has opened up",
        body: `${member.display_name} dropped out of ${formatShortDate(game.starts_at)}, ${formatTime(game.starts_at)} at ${game.venue}.`,
        url: `/game/${gameId}`,
      });
    }
  }

  console.log("[leaveGame] done");
  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);
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

  console.log("[addGuest] done —", outcome);
  revalidatePath(`/game/${gameId}`);
  revalidatePath("/");
  return { ok: true };
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

  console.log("[removePlayerFromGame] done");
  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);
}
