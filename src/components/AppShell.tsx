import Image from "next/image";
import Link from "next/link";
import BottomNav from "./BottomNav";
import RegisterServiceWorker from "./RegisterServiceWorker";

/** Header + bottom tab bar. Every signed-in page sits inside this. */
export default function AppShell({
  title,
  back,
  action,
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <RegisterServiceWorker />

      <header className="safe-top sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 pb-3">
          <Link href="/" className="shrink-0 rounded-md bg-white p-1">
            <Image
              src="/hatton-logo.jpg"
              alt="Hatton Sports Club"
              width={229}
              height={84}
              priority
              className="h-6 w-auto"
            />
          </Link>
          <h1 className="truncate text-[17px] font-semibold tracking-tight">
            {title}
          </h1>
          <div className="ml-auto shrink-0">{action}</div>
        </div>

        {back && (
          <div className="mx-auto max-w-lg px-4 pb-2">
            <Link
              href={back.href}
              className="inline-flex items-center gap-1 text-sm text-muted"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {back.label}
            </Link>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-6 pt-4">
        {children}
      </main>

      <BottomNav />
    </>
  );
}
