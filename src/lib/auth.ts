import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { SESSION_COOKIE, readSessionToken } from "./session";
import type { Member } from "./types";

/** Avatar colours, handed out in turn so two people rarely clash. */
export const COLOURS = [
  "sky",
  "emerald",
  "amber",
  "rose",
  "violet",
  "teal",
  "orange",
  "cyan",
] as const;

/**
 * Who is making this request? Returns null if they haven't joined yet, the
 * cookie has been tampered with, or an organiser has removed them from the
 * group — in which case they land back on /join like anybody else.
 */
export async function getCurrentMember(): Promise<Member | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const memberId = await readSessionToken(token);
  if (!memberId) return null;

  const { data, error } = await db()
    .from("members")
    .select("*")
    .eq("id", memberId)
    .is("removed_at", null)
    .maybeSingle();

  if (error) {
    console.error("[auth] failed to load member", error.message);
    return null;
  }
  return (data as Member) ?? null;
}

/** Same as above, but throws — for actions that must have a signed-in member. */
export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) throw new Error("NOT_SIGNED_IN");
  return member;
}

/**
 * Is the code someone typed on /join the right one?
 *
 * Deliberately forgiving: capitals don't matter, and neither do spaces. People
 * copying "HattonCompetitors" out of a WhatsApp message will variously type it
 * with a space in the middle, autocapitalised, or with a trailing space from a
 * sloppy copy-and-paste. None of those are wrong answers.
 */
export function isGroupCodeCorrect(input: string): boolean {
  const expected = process.env.GROUP_CODE;
  if (!expected) throw new Error("GROUP_CODE is not set");

  const normalise = (value: string) => value.replace(/\s+/g, "").toLowerCase();
  return normalise(input) === normalise(expected);
}

/** Quietly record that someone has been active, for the members list. */
export async function touchMember(memberId: string): Promise<void> {
  const { error } = await db()
    .from("members")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) console.error("[auth] failed to touch member", error.message);
}
