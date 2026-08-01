"use client";

import { useFormStatus } from "react-dom";
import { cancelGame } from "@/app/actions";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-danger/40 px-4 py-3 text-[15px] font-semibold text-danger disabled:opacity-60"
    >
      {pending ? "…" : "Cancel this game"}
    </button>
  );
}

export default function CancelGameButton({ gameId }: { gameId: string }) {
  return (
    <form
      action={cancelGame}
      onSubmit={(event) => {
        const ok = window.confirm(
          "Cancel this game? Everyone in it will be notified. It stays visible so nobody turns up by mistake.",
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="gameId" value={gameId} />
      <Button />
    </form>
  );
}
