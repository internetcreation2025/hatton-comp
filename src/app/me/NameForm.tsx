"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateName, type FormState } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl border border-line px-4 py-3 text-[15px] font-semibold disabled:opacity-60"
    >
      {pending ? "…" : "Save"}
    </button>
  );
}

export default function NameForm({ currentName }: { currentName: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    updateName,
    {},
  );
  // Held in state so a rejected name isn't wiped: React empties the form once
  // the action has run.
  const [name, setName] = useState(currentName);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[16px] outline-none focus:border-accent"
        />
        <Submit />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Saved.</p>}
    </form>
  );
}
