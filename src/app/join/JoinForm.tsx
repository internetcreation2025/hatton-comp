"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { joinGroup, type FormState } from "@/app/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-accent-ink disabled:opacity-60"
    >
      {pending ? "Just a second…" : "Let me in"}
    </button>
  );
}

export default function JoinForm() {
  const [state, formAction] = useActionState<FormState, FormData>(joinGroup, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="code"
          className="mb-1.5 block text-sm font-medium text-muted"
        >
          Group code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          required
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[16px] outline-none focus:border-accent"
        />
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-muted"
        >
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="e.g. Mike Sutherland"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
        />
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Use the name the group knows you by. If you&apos;ve been in before,
          type the same name to pick up where you left off.
        </p>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
