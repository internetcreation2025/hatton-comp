"use client";

import { useFormStatus } from "react-dom";
import { joinGame, leaveGame } from "@/app/actions";
import { startsWithin24Hours } from "@/lib/time";

type State = "playing" | "waiting" | "out";

function Button({ state, full }: { state: State; full: boolean }) {
  const { pending } = useFormStatus();

  const label =
    state === "playing"
      ? "Drop out"
      : state === "waiting"
        ? "Leave the waitlist"
        : full
          ? "Join the waitlist"
          : "Count me in";

  // Leaving is the one destructive thing here, so it's tinted red — enough to
  // give pause, not enough to shout.
  const style =
    state === "out"
      ? full
        ? "border border-line text-ink"
        : "bg-accent text-accent-ink"
      : "border border-danger/40 bg-danger/10 text-danger";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-xl px-4 py-3 text-[15px] font-semibold disabled:opacity-60 ${style}`}
    >
      {pending ? "…" : label}
    </button>
  );
}

export default function JoinLeaveButton({
  gameId,
  state,
  full,
  startsAt,
}: {
  gameId: string;
  state: State;
  full: boolean;
  startsAt: string;
}) {
  const leaving = state !== "out";

  return (
    <form
      action={leaving ? leaveGame : joinGame}
      onSubmit={(event) => {
        // Dropping out at the last minute leaves the others short — make sure
        // it isn't a mis-tap.
        if (state === "playing" && startsWithin24Hours(startsAt)) {
          const ok = window.confirm(
            "This game is within the next 24 hours and the others will be notified. Still dropping out?",
          );
          if (!ok) event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="gameId" value={gameId} />
      <Button state={state} full={full} />
    </form>
  );
}
