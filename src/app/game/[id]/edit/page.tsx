import { notFound, redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import GameForm from "@/components/GameForm";
import { editGame } from "@/app/actions";
import { getCurrentMember } from "@/lib/auth";
import { getGame, getRecentVenues } from "@/lib/games";
import { durationMinutes, utcToLondonInputs } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit game · Hatton Padel" };

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  // Only the organiser (or an admin) gets to change the details.
  if (game.created_by !== member.id && !member.is_admin) {
    redirect(`/game/${id}`);
  }

  const venues = await getRecentVenues();
  const { date, time } = utcToLondonInputs(game.starts_at);

  return (
    <AppShell
      title="Edit game"
      back={{ href: `/game/${id}`, label: "Back to game" }}
    >
      <GameForm
        action={editGame}
        gameId={game.id}
        venues={venues}
        submitLabel="Save changes"
        defaults={{
          date,
          time,
          duration: durationMinutes(game.starts_at, game.ends_at),
          venue: game.venue,
          court: game.court ?? "",
          notes: game.notes ?? "",
        }}
      />
    </AppShell>
  );
}
