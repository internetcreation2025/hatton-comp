"use client";

import { useActionState, useRef, useState } from "react";
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

function ConfirmButtons({ existingName }: { existingName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="confirm"
      value="yes"
      disabled={pending}
      className="w-full rounded-xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-accent-ink disabled:opacity-60"
    >
      {pending ? "Just a second…" : `Yes, I'm ${existingName}`}
    </button>
  );
}

export default function JoinForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(joinGroup, {});
  const [name, setName] = useState("");
  const nameField = useRef<HTMLInputElement>(null);

  // A fresh state object means the action just came back.
  const [lastState, setLastState] = useState(state);
  const [asking, setAsking] = useState(false);
  if (state !== lastState) {
    setLastState(state);
    setAsking(Boolean(state.clash));
  }

  function notMe() {
    setAsking(false);
    setName("");
    // Give them the field back with the cursor in it.
    requestAnimationFrame(() => nameField.current?.focus());
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {/* Kept in the DOM while we're asking, so the answer submits with it. */}
      <div hidden={asking} className="flex flex-col gap-4">
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
            ref={nameField}
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Mike Sutherland"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
          />
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Use the name the group knows you by. If you&apos;ve been in before,
            type the same name to pick up where you left off.
          </p>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-muted"
          >
            Your mobile{" "}
            <span className="font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07789 913706"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
          />
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Shown on the Players page so the group can reach you about a game.
            Leave it blank if you&apos;d rather not — you can add it later.
          </p>
        </div>
      </div>

      {asking && state.clash && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <p className="text-[15px] leading-relaxed">
            <span className="font-semibold">{state.clash}</span>{" "}
            {state.clashRemoved
              ? "was in the group before. Is that you?"
              : "is already in the group. Is that you?"}
          </p>
          <ConfirmButtons existingName={state.clash} />
          <button
            type="button"
            onClick={notMe}
            className="w-full rounded-xl border border-line px-4 py-3 text-[15px] font-medium"
          >
            No, I&apos;m someone else
          </button>
          <p className="text-[13px] leading-relaxed text-muted">
            If you&apos;re a different person with the same name, add your
            surname or an initial so the group can tell you apart.
          </p>
        </div>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      {!asking && <Submit />}
    </form>
  );
}
