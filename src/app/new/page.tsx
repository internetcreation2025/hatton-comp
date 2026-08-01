import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import GameForm from "@/components/GameForm";
import { createGame } from "@/app/actions";
import { getCurrentMember } from "@/lib/auth";
import { getRecentVenues } from "@/lib/games";
import { utcToLondonInputs } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "New game · Hatton Padel" };

export default async function NewGamePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const venues = await getRecentVenues();

  // Sensible starting point: today's date, next round hour, 90 minutes.
  const now = new Date();
  const { date } = utcToLondonInputs(now.toISOString());
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  const { time } = utcToLondonInputs(nextHour.toISOString());

  return (
    <AppShell title="New game" back={{ href: "/", label: "Upcoming" }}>
      <GameForm
        action={createGame}
        venues={venues}
        submitLabel="Create game"
        showPlayingToggle
        defaults={{
          date,
          time: `${time.slice(0, 2)}:00`,
          duration: 90,
          venue: "Hatton",
          court: "",
          notes: "",
        }}
      />
    </AppShell>
  );
}
