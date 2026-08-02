"use client";

import { useState } from "react";

/**
 * "Add to calendar", with the choice of where.
 *
 * There's no way to detect which calendar someone actually uses, so ask. The
 * .ics file covers Apple Calendar and anything else; Google and Outlook get
 * direct links because those open the event ready to save in one tap.
 */

type Props = {
  gameId: string;
  googleUrl: string;
  outlookUrl: string;
  summary: string;
};

function Choice({
  href,
  download,
  label,
  hint,
}: {
  href: string;
  download?: boolean;
  label: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      {...(download
        ? { download: "padel.ics" }
        : { target: "_blank", rel: "noopener noreferrer" })}
      className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block text-[13px] text-muted">{hint}</span>
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-muted"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </a>
  );
}

export default function AddToCalendar({
  gameId,
  googleUrl,
  outlookUrl,
  summary,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-line px-4 py-3.5 text-[16px] font-semibold"
      >
        Add to calendar
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-muted">
        Which calendar?
      </p>

      <Choice
        href={`/game/${gameId}/calendar.ics`}
        download
        label="Apple Calendar"
        hint="iPhone, iPad or Mac"
      />
      <Choice
        href={googleUrl}
        label="Google Calendar"
        hint="Android, or Google on the web"
      />
      <Choice
        href={outlookUrl}
        label="Outlook"
        hint="Outlook.com or Microsoft 365"
      />
      <Choice
        href={`/game/${gameId}/calendar.ics`}
        download
        label="Any other calendar"
        hint="Downloads a standard .ics file"
      />

      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        Saves it as &ldquo;{summary}&rdquo;. The app still sends you a
        notification an hour before, so no need to set your own alarm.
      </p>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-1 text-[13px] font-medium text-muted"
      >
        Close
      </button>
    </div>
  );
}
