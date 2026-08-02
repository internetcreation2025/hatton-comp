import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { safeNext } from "@/lib/next-url";
import JoinForm from "./JoinForm";

export const metadata = { title: "Join · Hatton Competitors" };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  // Already in? Don't make them do this twice.
  if (await getCurrentMember()) redirect(destination);

  const invited = destination !== "/";

  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Image
              src="/hatton-logo.jpg"
              alt="Hatton Sports Club"
              width={229}
              height={84}
              priority
              className="h-10 w-auto"
            />
          </div>
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight">
          Hatton Competitors
        </h1>
        <p className="mt-2 text-center text-[15px] leading-relaxed text-muted">
          {invited
            ? "One quick step and you'll go straight to that game."
            : "The place the games actually live. Enter the code from the WhatsApp group, then tell us who you are."}
        </p>

        <div className="mt-8">
          <JoinForm next={destination} />
        </div>
      </div>
    </main>
  );
}
