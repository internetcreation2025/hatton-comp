"use client";

import { useEffect, useState } from "react";

/**
 * Works out what phone someone is holding and shows only the steps that apply
 * to it. The whole point is that this link can be dropped in the WhatsApp group
 * instead of typing instructions that are wrong for half the people reading.
 */

type Platform =
  | "checking"
  | "installed"
  | "ios-safari"
  | "ios-other"
  | "android"
  | "android-other"
  | "desktop";

/** Chrome fires this before showing its own install prompt; we save it for the button. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[14px] font-bold text-accent-ink">
        {n}
      </span>
      <span className="pt-0.5 text-[15px] leading-relaxed">{children}</span>
    </li>
  );
}

/**
 * Samsung Internet, Firefox, Opera and the like on Android.
 *
 * These build the home-screen app themselves, and Android's Play Protect
 * refuses to install what they produce — "Unsafe app blocked … built for an
 * older version of Android". Nothing to do with this site; it's the package
 * the browser made. Chrome asks Google to build it instead, which works.
 */
function OpenInChrome() {
  const [copied, setCopied] = useState(false);

  function openChrome() {
    const { host, pathname } = window.location;
    // Android's way of saying "open this in that app, please".
    window.location.href = `intent://${host}${pathname}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-[15px] leading-relaxed text-muted">
        You&apos;re on Android, but not in Chrome. This browser makes its own
        version of the app, and Android blocks it — you&apos;d get an{" "}
        <strong>&ldquo;Unsafe app blocked&rdquo;</strong> warning. Chrome
        doesn&apos;t have that problem.
      </p>

      <button
        type="button"
        onClick={openChrome}
        className="w-full rounded-xl bg-accent px-4 py-4 text-[17px] font-semibold text-accent-ink"
      >
        Open this page in Chrome
      </button>

      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Then follow the steps there — it takes two taps. If that button
        doesn&apos;t do anything, Chrome may not be on this phone.
      </p>

      <button
        type="button"
        onClick={copyLink}
        className="mt-4 w-full rounded-xl border border-line px-4 py-3 text-[15px] font-medium"
      >
        {copied ? "Copied — now paste it into Chrome" : "Copy the link instead"}
      </button>

      <p className="mt-5 rounded-xl bg-surface-2 px-4 py-3 text-[14px] leading-relaxed">
        <strong>Don&apos;t want to bother?</strong> Use the link at the bottom of
        this page. It all works in this browser, notifications included — you
        just won&apos;t have the icon on your home screen.
      </p>
    </div>
  );
}

export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>("checking");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // The browser is the external system here — none of this exists until the
    // page is running on a real device.
    async function detect(): Promise<Platform> {
      const ua = navigator.userAgent;

      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true;

      if (standalone) return "installed";

      if (/iPad|iPhone|iPod/.test(ua)) {
        // Chrome and Firefox on iOS can't add to the home screen. Only Safari can.
        return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? "ios-other" : "ios-safari";
      }

      if (/Android/.test(ua)) {
        // Chrome hands the job to Google, which builds a properly signed app.
        // Samsung Internet and the rest build their own, and Android now
        // refuses to install those — "Unsafe app blocked". Send them to Chrome
        // rather than let them hit a security warning they can't act on.
        const chromeLike =
          /Chrome\//.test(ua) &&
          !/SamsungBrowser|EdgA|OPR\/|YaBrowser|UCBrowser|MiuiBrowser|HuaweiBrowser/.test(ua);
        return chromeLike ? "android" : "android-other";
      }
      return "desktop";
    }

    detect().then(setPlatform, () => setPlatform("desktop"));
  }, []);

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!prompt) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  }

  if (platform === "checking") {
    return <p className="text-[15px] text-muted">One moment…</p>;
  }

  if (platform === "installed") {
    return (
      <div className="rounded-2xl border border-success/40 bg-success/10 p-5 text-center">
        <p className="text-[17px] font-semibold text-success">
          You&apos;re all set
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
          You&apos;re already running the installed app. Head to Settings and
          turn notifications on if you haven&apos;t.
        </p>
      </div>
    );
  }

  if (platform === "ios-safari") {
    return (
      <div>
        <p className="mb-4 text-[15px] leading-relaxed text-muted">
          You&apos;re on an iPhone. Three taps:
        </p>
        <ol className="flex flex-col gap-4">
          <Step n={1}>
            Tap the <strong>Share</strong> button at the bottom of the screen —
            the square with an arrow pointing up out of it.
          </Step>
          <Step n={2}>
            Scroll down the list and tap{" "}
            <strong>Add to Home Screen</strong>.
          </Step>
          <Step n={3}>
            Tap <strong>Add</strong> in the top right. The yellow ball icon
            appears on your home screen.
          </Step>
        </ol>
        <p className="mt-5 rounded-xl bg-surface-2 px-4 py-3 text-[14px] leading-relaxed">
          <strong>Then open it from that icon</strong>, not from Safari.
          iPhones only allow notifications once the app is installed, so this
          step is what lets you hear about new games.
        </p>
      </div>
    );
  }

  if (platform === "ios-other") {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-[16px] font-semibold">Open this page in Safari</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
          On an iPhone, only Safari can add an app to the home screen — Chrome
          and Firefox can&apos;t. Copy this page&apos;s address, paste it into
          Safari, and the steps will be here.
        </p>
      </div>
    );
  }

  if (platform === "android-other") {
    return <OpenInChrome />;
  }

  if (platform === "android") {
    return (
      <div>
        {prompt ? (
          <>
            <p className="mb-4 text-[15px] leading-relaxed text-muted">
              You&apos;re on Android. One tap:
            </p>
            <button
              type="button"
              onClick={install}
              disabled={installing}
              className="w-full rounded-xl bg-accent px-4 py-4 text-[17px] font-semibold text-accent-ink disabled:opacity-60"
            >
              {installing ? "Installing…" : "Install the app"}
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-[15px] leading-relaxed text-muted">
              You&apos;re on Android. Three taps:
            </p>
            <ol className="flex flex-col gap-4">
              <Step n={1}>
                Tap the <strong>three dots</strong> at the top right of Chrome.
              </Step>
              <Step n={2}>
                Tap <strong>Add to Home screen</strong> or{" "}
                <strong>Install app</strong>.
              </Step>
              <Step n={3}>
                Confirm, and the yellow ball icon appears on your home screen.
              </Step>
            </ol>
          </>
        )}
        <p className="mt-5 rounded-xl bg-surface-2 px-4 py-3 text-[14px] leading-relaxed">
          <strong>Then open it from that icon.</strong> Go to Settings and turn
          notifications on so you hear about new games.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-[16px] font-semibold">You&apos;re on a computer</p>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
        The app works fine here, but it&apos;s built for a phone. Open this same
        link on your mobile and it&apos;ll show you how to add it to your home
        screen.
      </p>
    </div>
  );
}
