import { ImageResponse } from "next/og";
import { getGame } from "@/lib/games";
import { formatShortDate, formatTimeRange } from "@/lib/time";
import { spotsLine } from "@/lib/share";

/**
 * The card WhatsApp shows when a game link is pasted into the chat.
 *
 * Drawn fresh on every request, so a link posted after someone joins shows the
 * updated line-up. WhatsApp caches previews per URL, which is why the share
 * button adds a changing query string each time it posts.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Padel game details";

const NAVY = "#14137a";
const YELLOW = "#ffc61b";
const INK = "#101836";
const MUTED = "#5c6784";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            fontSize: 48,
            color: INK,
          }}
        >
          Hatton Competitors
        </div>
      ),
      size,
    );
  }

  const cancelled = game.status === "cancelled";
  const names = game.players.map((p) => p.name);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 34,
                background: YELLOW,
                display: "flex",
              }}
            />
            Hatton Competitors
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 76,
              fontWeight: 700,
              color: cancelled ? MUTED : INK,
              textDecoration: cancelled ? "line-through" : "none",
              display: "flex",
            }}
          >
            {formatShortDate(game.starts_at)},{" "}
            {formatTimeRange(game.starts_at, game.ends_at)}
          </div>

          <div
            style={{ marginTop: 14, fontSize: 40, color: MUTED, display: "flex" }}
          >
            {game.venue}
            {game.court ? ` · Court ${game.court}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {Array.from({ length: game.capacity }).map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: 92,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  padding: "0 12px",
                  textAlign: "center",
                  background: names[index] ? "#eef1f8" : "#ffffff",
                  border: names[index] ? "none" : "3px dashed #d9e0ee",
                  color: names[index] ? INK : "#a7b1cc",
                }}
              >
                {names[index] ?? "Empty"}
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 34,
              alignSelf: "flex-start",
              padding: "16px 32px",
              borderRadius: 999,
              fontSize: 34,
              fontWeight: 700,
              display: "flex",
              background: cancelled ? "#eef1f8" : NAVY,
              color: cancelled ? MUTED : "#ffffff",
            }}
          >
            {spotsLine(game)}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
