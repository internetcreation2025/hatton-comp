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

  // Sensible starting point: the next round hour, 90 minutes long. Taking the
  // date from the same instant as the time keeps it right late at night, when
  // "an hour from now" is already tomorrow.
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  const { date, time } = utcToLondonInputs(nextHour.toISOString());

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
