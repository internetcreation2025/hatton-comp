import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import GameForm from "@/components/GameForm";
import { createGame } from "@/app/actions";
import { getCurrentMember } from "@/lib/auth";
import { getRecentVenues } from "@/lib/games";
import { defaultGameStart } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "New game · Hatton Competitors" };

export default async function NewGamePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const venues = await getRecentVenues();

  const { date, time } = defaultGameStart();

  return (
    <AppShell title="New game" back={{ href: "/", label: "Upcoming" }}>
      <GameForm
        action={createGame}
        venues={venues}
        submitLabel="Create game"
        showPlayingToggle
        defaults={{
          date,
          time,
          duration: 90,
          venue: "Hatton",
          court: "",
          notes: "",
        }}
      />
    </AppShell>
  );
}
