import Image from "next/image";
import Link from "next/link";
import InstallGuide from "./InstallGuide";

export const metadata = {
  title: "Get the app · Hatton Competitors",
  robots: { index: false, follow: false },
};

/**
 * The link that goes in the WhatsApp group. Deliberately readable without
 * signing in — asking someone for a group code before they've even got the app
 * on their phone is one hurdle too many.
 */
export default function InstallPage() {
  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-7 flex justify-center">
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
          Get the app
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-[15px] leading-relaxed text-muted">
          Padel games for the Hatton competitors — who&apos;s playing, and when.
          It takes about ten seconds.
        </p>

        <div className="mt-8">
          <InstallGuide />
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <Link
            href="/"
            className="block rounded-xl border border-line px-4 py-3.5 text-center text-[15px] font-semibold"
          >
            Skip — just open it in the browser
          </Link>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-muted">
            You&apos;ll need the group code from the WhatsApp chat either way.
          </p>
        </div>
      </div>
    </main>
  );
}
