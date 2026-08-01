import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import JoinForm from "./JoinForm";

export const metadata = { title: "Join · Hatton Padel" };

export default async function JoinPage() {
  // Already in? Don't make them do this twice.
  if (await getCurrentMember()) redirect("/");

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
          Hatton Padel
        </h1>
        <p className="mt-2 text-center text-[15px] leading-relaxed text-muted">
          The place the games actually live. Enter the code from the WhatsApp
          group, then tell us who you are.
        </p>

        <div className="mt-8">
          <JoinForm />
        </div>
      </div>
    </main>
  );
}
