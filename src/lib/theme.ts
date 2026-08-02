export const THEME_COOKIE = "hp_theme";
export const THEME_MAX_AGE = 60 * 60 * 24 * 365; // one year

export type Theme = "light" | "dark";

/** Light unless someone has deliberately chosen dark. */
export function readTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}

/** The browser chrome colour that goes with each theme. */
export const THEME_COLOUR: Record<Theme, string> = {
  light: "#f4f6fb",
  dark: "#080d1c",
};
