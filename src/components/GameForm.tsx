"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";

const DURATIONS = [60, 90, 120];

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-accent-ink disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium text-muted";

export default function GameForm({
  action,
  venues,
  submitLabel,
  gameId,
  defaults,
  showPlayingToggle = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  venues: string[];
  submitLabel: string;
  gameId?: string;
  defaults: {
    date: string;
    time: string;
    duration: number;
    venue: string;
    court: string;
    notes: string;
  };
  showPlayingToggle?: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const [duration, setDuration] = useState(defaults.duration);
  const [venue, setVenue] = useState(defaults.venue);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {gameId && <input type="hidden" name="gameId" value={gameId} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date" className={labelClass}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaults.date}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="time" className={labelClass}>
            Start
          </label>
          <input
            id="time"
            name="time"
            type="time"
            required
            step={300}
            defaultValue={defaults.time}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>How long</span>
        <input type="hidden" name="duration" value={duration} />
        <div className="flex gap-2">
          {DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setDuration(minutes)}
              aria-pressed={duration === minutes}
              className={`flex-1 rounded-xl border px-3 py-3 text-[15px] font-medium ${
                duration === minutes
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line bg-surface text-ink"
              }`}
            >
              {minutes === 60 ? "1 hr" : minutes === 90 ? "1½ hrs" : "2 hrs"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="venue" className={labelClass}>
          Where
        </label>
        <input
          id="venue"
          name="venue"
          type="text"
          required
          value={venue}
          onChange={(event) => setVenue(event.target.value)}
          placeholder="Hatton"
          className={fieldClass}
        />
        {venues.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {venues.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setVenue(option)}
                className="rounded-full border border-line px-3 py-1.5 text-[13px] text-muted"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="court" className={labelClass}>
          Court <span className="font-normal">(optional)</span>
        </label>
        <input
          id="court"
          name="court"
          type="text"
          defaultValue={defaults.court}
          placeholder="e.g. 2"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaults.notes}
          placeholder="Anything the others should know"
          className={`${fieldClass} resize-none`}
        />
      </div>

      {showPlayingToggle && (
        <label className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
          <input
            type="checkbox"
            name="playing"
            defaultChecked
            className="mt-0.5 h-5 w-5 accent-[var(--accent)]"
          />
          <span className="text-[15px] leading-snug">
            I&apos;m playing in this one
            <span className="mt-0.5 block text-[13px] text-muted">
              Untick if you&apos;re just organising it.
            </span>
          </span>
        </label>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <Submit label={submitLabel} />
    </form>
  );
}
