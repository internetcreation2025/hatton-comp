"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { addGuest, type FormState } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl bg-accent px-4 py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-60"
    >
      {pending ? "…" : "Add"}
    </button>
  );
}

export default function AddGuestForm({ gameId }: { gameId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(addGuest, {});

  // useActionState hands back a fresh object on every submit, so a change in
  // identity means "the action just finished". Fold the panel away on success.
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
        className="w-full rounded-xl border border-dashed border-line px-4 py-3 text-[15px] font-medium text-muted"
      >
        Add someone who isn&apos;t in the group
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="gameId" value={gameId} />
      <div className="flex gap-2">
        <input
          name="guestName"
          type="text"
          required
          autoFocus
          placeholder="Their name"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
        />
        <Submit />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="self-start text-sm text-muted"
      >
        Cancel
      </button>
    </form>
  );
}
