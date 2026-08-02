"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Avatar from "./Avatar";
import { addGuest, addMemberToGame, type FormState } from "@/app/actions";
import { useActionState } from "react";

export type Candidate = { id: string; display_name: string; colour: string };

function MemberRow({
  gameId,
  candidate,
}: {
  gameId: string;
  candidate: Candidate;
}) {
  return (
    <form action={addMemberToGame}>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="memberId" value={candidate.id} />
      <MemberButton candidate={candidate} />
    </form>
  );
}

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
      <span className="ml-auto shrink-0 text-[13px] font-semibold text-accent">
        {pending ? "…" : "Add"}
      </span>
    </button>
  );
}

function GuestSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl border border-line px-4 py-3 text-[15px] font-semibold disabled:opacity-60"
    >
      {pending ? "…" : "Add"}
    </button>
  );
}

/**
 * One place to fill a game: tap a name from the group, or type a name for
 * someone who isn't in it.
 *
 * Open to anyone, not just whoever set the game up — people say "put me down"
 * in the chat and whoever reads it first should be able to act on it. Each add
 * is recorded against the person who did it.
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
  const [state, formAction] = useActionState<FormState, FormData>(addGuest, {});

  // A fresh state object means the action just finished.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.ok) setOpen(false);
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

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      {full && (
        <p className="mb-2 px-1 text-[13px] leading-relaxed text-muted">
          This game is full — anyone you add goes on the waitlist.
        </p>
      )}

      {candidates.length > 0 && (
        <>
          <p className="mb-1 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted">
            From the group
          </p>
          <ul className="mb-3 flex max-h-64 flex-col overflow-y-auto">
            {candidates.map((candidate) => (
              <li key={candidate.id}>
                <MemberRow gameId={gameId} candidate={candidate} />
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mb-1.5 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted">
        {candidates.length > 0 ? "Or someone else" : "Add someone by name"}
      </p>

      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="gameId" value={gameId} />
        <div className="flex gap-2">
          <input
            name="guestName"
            type="text"
            required
            placeholder="Their name"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
          />
          <GuestSubmit />
        </div>

        {state.error && (
          <p role="alert" className="px-1 text-sm text-danger">
            {state.error}
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 w-full py-1.5 text-[14px] font-medium text-muted"
      >
        Done
      </button>
    </div>
  );
}
