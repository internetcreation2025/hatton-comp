"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Avatar from "./Avatar";
import {
  removeMember,
  savePhone,
  setAdmin,
  type FormState,
} from "@/app/actions";
import { toDiallable, toWhatsAppNumber } from "@/lib/phone";

export type DirectoryEntry = {
  id: string;
  display_name: string;
  colour: string;
  phone: string | null;
  is_admin: boolean;
  gamesPlayed: number;
};

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl bg-accent px-4 py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-60"
    >
      {pending ? "…" : "Save"}
    </button>
  );
}

/** Small text-link buttons that know when their own form is mid-flight. */
function AdminLink({ isAdmin }: { isAdmin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[13px] font-medium text-accent underline underline-offset-2 disabled:opacity-50"
    >
      {pending ? "…" : isAdmin ? "Remove organiser rights" : "Make organiser"}
    </button>
  );
}

function ConfirmRemove({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-destructive px-4 py-3 text-[15px] font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Removing…" : `Remove ${name}`}
    </button>
  );
}

export default function PlayerRow({
  entry,
  canEdit,
  canManage,
  isYou,
}: {
  entry: DirectoryEntry;
  canEdit: boolean;
  /** Viewer is an organiser looking at somebody else's row. */
  canManage: boolean;
  isYou: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(savePhone, {});

  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.ok) setEditing(false);
  }

  const whatsapp = entry.phone ? toWhatsAppNumber(entry.phone) : null;

  return (
    <li className="rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <Avatar name={entry.display_name} colour={entry.colour} size={40} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold">
            {entry.display_name}
            {isYou && (
              <span className="ml-1.5 text-[13px] font-normal text-muted">
                (you)
              </span>
            )}
            {entry.is_admin && (
              <span className="ml-1.5 align-middle rounded-full border border-line px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                Organiser
              </span>
            )}
          </p>
          <p className="truncate text-[13px] text-muted">
            {entry.phone ?? "No number yet"}
            {entry.gamesPlayed > 0 && (
              <span>
                {" · "}
                {entry.gamesPlayed} game{entry.gamesPlayed === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>

        {entry.phone && !editing && (
          <div className="flex shrink-0 items-center gap-1.5">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Message ${entry.display_name} on WhatsApp`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.2 1.25-1.97 1.41-.53.11-1.21.2-3.51-.75-2.95-1.22-4.85-4.21-5-4.41-.14-.2-1.19-1.58-1.19-3.02s.76-2.14 1.03-2.43c.27-.29.58-.37.78-.37.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.02.9 2.17.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.3.37-.42.5-.14.14-.29.29-.12.58.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.15.46.12.63-.07.17-.2.72-.84.91-1.13.19-.29.39-.24.65-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.72-.17 1.4z" />
                </svg>
              </a>
            )}
            <a
              href={`tel:${toDiallable(entry.phone)}`}
              aria-label={`Call ${entry.display_name}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {!editing && !confirming && (canEdit || canManage) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[13px] font-medium text-accent underline underline-offset-2"
            >
              {entry.phone ? "Change number" : "Add a number"}
            </button>
          )}

          {canManage && (
            <form action={setAdmin}>
              <input type="hidden" name="memberId" value={entry.id} />
              <input
                type="hidden"
                name="admin"
                value={entry.is_admin ? "no" : "yes"}
              />
              <AdminLink isAdmin={entry.is_admin} />
            </form>
          )}

          {/* Organisers have to be stood down first — one deliberate step at a time. */}
          {canManage && !entry.is_admin && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-[13px] font-medium text-danger underline underline-offset-2"
            >
              Remove from group
            </button>
          )}
        </div>
      )}

      {confirming && (
        <div className="mt-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3.5">
          <p className="text-[14px] leading-relaxed">
            Remove{" "}
            <span className="font-semibold">{entry.display_name}</span> from the
            group?
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            They&apos;ll disappear from this list and from any games still to
            come, and stop getting notifications. Games they&apos;ve already
            played keep their name. If they still have the group code they can
            join again.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <form action={removeMember}>
              <input type="hidden" name="memberId" value={entry.id} />
              <ConfirmRemove name={entry.display_name} />
            </form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="w-full rounded-xl border border-line px-4 py-3 text-[15px] font-medium"
            >
              Keep them
            </button>
          </div>
        </div>
      )}

      {editing && (
        <form action={formAction} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="memberId" value={entry.id} />
          <div className="flex gap-2">
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={entry.phone ?? ""}
              placeholder="07789 913706"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
            />
            <Save />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-[13px] font-medium text-muted"
            >
              Cancel
            </button>
            <p className="text-[12px] text-muted">
              Leave it blank to remove the number
            </p>
          </div>
        </form>
      )}
    </li>
  );
}
