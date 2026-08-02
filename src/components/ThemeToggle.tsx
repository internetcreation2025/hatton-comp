"use client";

import { useEffect, useState } from "react";
import {
  THEME_COLOUR,
  THEME_COOKIE,
  THEME_MAX_AGE,
  type Theme,
} from "@/lib/theme";

/**
 * Light or dark. The choice is applied to the page immediately and saved in a
 * cookie, which the server reads on the next visit so the app opens in the
 * right colours.
 */
export default function ThemeToggle({ current }: { current: Theme }) {
  const [theme, setTheme] = useState<Theme>(current);

  // The page itself, the browser chrome colour and the saved preference all
  // live outside React, so they're synchronised here rather than in the click.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOUR[theme]);

    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_MAX_AGE}; samesite=lax`;
  }, [theme]);

  const options: Array<{ value: Theme; label: string }> = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  return (
    <div>
      <div role="group" aria-label="Appearance" className="flex gap-2">
        {options.map((option) => {
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={active}
              className={`flex-1 rounded-xl border px-3 py-3 text-[15px] font-medium ${
                active
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line bg-surface text-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Dark is easier on the eyes for evening games.
      </p>
    </div>
  );
}
