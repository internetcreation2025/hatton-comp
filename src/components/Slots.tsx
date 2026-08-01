import Avatar from "./Avatar";
import type { ResolvedPlayer } from "@/lib/types";

/**
 * The four player slots. Filled slots show who; empty slots look genuinely
 * empty so it's obvious at a glance how many are still needed.
 */
export default function Slots({
  players,
  capacity,
  cancelled = false,
}: {
  players: ResolvedPlayer[];
  capacity: number;
  cancelled?: boolean;
}) {
  const empties = Math.max(0, capacity - players.length);

  return (
    <ul className="flex flex-col gap-1.5">
      {players.map((player) => (
        <li
          key={player.id}
          className="slot-in flex items-center gap-2.5 rounded-lg bg-surface-2 px-2.5 py-2"
        >
          <Avatar
            name={player.name}
            colour={player.colour}
            size={30}
            dimmed={cancelled}
          />
          <span
            className={`truncate text-[15px] font-medium ${
              cancelled ? "text-muted line-through" : "text-ink"
            }`}
          >
            {player.name}
          </span>
          {player.isGuest && (
            <span className="ml-auto shrink-0 rounded-full border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
              Guest
            </span>
          )}
        </li>
      ))}

      {Array.from({ length: empties }).map((_, index) => (
        <li
          key={`empty-${index}`}
          className="flex items-center gap-2.5 rounded-lg border border-dashed border-line px-2.5 py-2"
        >
          <span
            aria-hidden="true"
            className="h-[30px] w-[30px] shrink-0 rounded-full border border-dashed border-line"
          />
          <span className="text-[15px] text-muted">Empty</span>
        </li>
      ))}
    </ul>
  );
}
