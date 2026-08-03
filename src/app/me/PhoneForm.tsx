"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { savePhone, type FormState } from "@/app/actions";

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

export default function PhoneForm({
  memberId,
  phone,
}: {
  memberId: string;
  phone: string | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(savePhone, {});
  // See NameForm — React empties the form after the action runs.
  const [value, setValue] = useState(phone ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="memberId" value={memberId} />
      <div className="flex gap-2">
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="07789 913706"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
        />
        <Submit />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Saved.</p>}

      <p className="text-[13px] leading-relaxed text-muted">
        Optional. It appears on the Players page so the group can reach you.
        Leave it blank to remove it.
      </p>
    </form>
  );
}
