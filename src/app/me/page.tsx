import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import NotificationsToggle from "@/components/NotificationsToggle";
import ThemeToggle from "@/components/ThemeToggle";
import NameForm from "./NameForm";
import PhoneForm from "./PhoneForm";
import { signOut } from "@/app/actions";
import { getCurrentMember } from "@/lib/auth";
import { THEME_COOKIE, readTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Hatton Competitors" };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2.5 px-0.5 text-[13px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      <div className="rounded-2xl border border-line bg-surface p-4">
        {children}
      </div>
    </section>
  );
}

export default async function MePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/join");

  const theme = readTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Avatar name={member.display_name} colour={member.colour} size={52} />
          <div className="min-w-0">
            <p className="truncate text-[19px] font-semibold tracking-tight">
              {member.display_name}
            </p>
            {member.is_admin && (
              <p className="text-[13px] text-muted">Organiser</p>
            )}
          </div>
        </div>

        <Section title="Your name">
          <NameForm currentName={member.display_name} />
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            This is what the group sees on every game.
          </p>
        </Section>

        <Section title="Your mobile number">
          <PhoneForm memberId={member.id} phone={member.phone} />
        </Section>

        <Section title="Appearance">
          <ThemeToggle current={theme} />
        </Section>

        <Section title="Notifications">
          <NotificationsToggle />
        </Section>

        <Section title="Put it on your Home Screen">
          <p className="text-[15px] leading-relaxed text-muted">
            It then opens like a normal app — full screen, its own icon, and
            notifications work.
          </p>
          <Link
            href="/install"
            className="mt-3 block rounded-xl border border-line px-4 py-3 text-center text-[15px] font-semibold"
          >
            Show me how
          </Link>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            This is also the link to share with anyone joining —
            hatton-comp.vercel.app/install
          </p>
        </Section>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-xl border border-line px-4 py-3 text-[15px] font-medium text-muted"
          >
            Sign out on this phone
          </button>
        </form>
      </div>
    </AppShell>
  );
}
