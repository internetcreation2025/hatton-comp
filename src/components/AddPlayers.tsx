"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Avatar from "./Avatar";
import { addGuest, addMemberToGame, type FormState } from "@/app/actions";

export type Candidate = { id: string; display_name: string; colour: string };

/** How many of the group to show before anyone types. */
const PREVIEW = 5;

function MemberButton({ candidate }: { candidate: Candidate }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left disabled:opacity-50"
    >
      <Avatar name={candidate.display_name} colour={candidate.colour} size={30} />
      <span className="truncate text-[15px]">{candidate.display_name}</span>
      <span className="ml-auto shrink-0 text-[13px] font-semibold text-success">
        {pending ? "…" : "Add"}
      </span>
    </button>
  );
}

function GuestButton({ name }: { name: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-dashed border-line text-muted"
      >
        +
      </span>
      <span className="truncate text-[15px]">
        Add <span className="font-semibold">{name}</span> as a guest
      </span>
      <span className="ml-auto shrink-0 text-[13px] font-semibold text-success">
        {pending ? "…" : "Add"}
      </span>
    </button>
  );
}

/**
 * One box to fill a game. Typing narrows the group down; if what you've typed
 * isn't one of them, the same text adds a guest.
 *
 * With 25-odd people a plain list is a long scroll and a poor way to find
 * anyone, so nothing is listed beyond a handful of the most recently active
 * until you start typing.
 */
export default function AddPlayers({
  gameId,
  candidates,
  full,
}: {
  gameId: string;
  candidates: Candidate[];
  full: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(addGuest, {});

  // A fresh state object means the action just finished.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.ok) {
      setOpen(false);
      setQuery("");
      setShowAll(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-success/40 bg-success/10 px-4 py-3.5 text-[16px] font-semibold text-success"
      >
        {full ? "Add a player to the waitlist" : "Add a player"}
      </button>
    );
  }

  const typed = query.trim();
  const needle = typed.toLowerCase();

  const matches = needle
    ? candidates.filter((c) => c.display_name.toLowerCase().includes(needle))
    : candidates;

  const visible = needle || showAll ? matches : matches.slice(0, PREVIEW);
  const hidden = matches.length - visible.length;

  const alreadyAMember = candidates.some(
    (c) => c.display_name.toLowerCase() === needle,
  );
  const offerGuest = typed.length >= 2 && !alreadyAMember;

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      {full && (
        <p className="mb-2 px-1 text-[13px] leading-relaxed text-muted">
          This game is full — anyone you add goes on the waitlist.
        </p>
      )}

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus
        placeholder={
          candidates.length > 0
            ? "Search the group, or type a new name"
            : "Type a name"
        }
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
      />

      <ul className="mt-2 flex max-h-72 flex-col overflow-y-auto">
        {visible.map((candidate) => (
          <li key={candidate.id}>
            <form action={addMemberToGame}>
              <input type="hidden" name="gameId" value={gameId} />
              <input type="hidden" name="memberId" value={candidate.id} />
              <MemberButton candidate={candidate} />
            </form>
          </li>
        ))}

        {offerGuest && (
          <li>
            <form action={formAction}>
              <input type="hidden" name="gameId" value={gameId} />
              <input type="hidden" name="guestName" value={typed} />
              <GuestButton name={typed} />
            </form>
          </li>
        )}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-1 w-full py-2 text-[14px] font-medium text-muted"
        >
          Show all {matches.length} in the group
        </button>
      )}

      {needle && matches.length === 0 && !offerGuest && (
        <p className="px-2.5 py-2 text-[14px] text-muted">
          Nobody in the group matches that.
        </p>
      )}

      {state.error && (
        <p role="alert" className="px-2.5 py-1 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setQuery("");
          setShowAll(false);
        }}
        className="mt-1 w-full py-1.5 text-[14px] font-medium text-muted"
      >
        Done
      </button>
    </div>
  );
}
