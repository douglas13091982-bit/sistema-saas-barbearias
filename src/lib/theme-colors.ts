import type { CSSProperties } from "react";
import type { ThemeSettings } from "@/types";

export function contrastingText(hex: string, fallback = "#172c26") {
  const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return fallback;

  const [red, green, blue] = match.slice(1).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

export function bookingTheme(theme: ThemeSettings): CSSProperties {
  return {
    color: theme.textColor,
    backgroundColor: theme.backgroundColor,
    fontFamily: `${theme.fontFamily}, system-ui, sans-serif`,
    "--booking-muted": `color-mix(in srgb, ${theme.textColor} 74%, ${theme.backgroundColor})`,
    "--booking-line": `color-mix(in srgb, ${theme.textColor} 18%, ${theme.backgroundColor})`,
    "--booking-surface": theme.secondaryColor === "#16213e"
      ? `color-mix(in srgb, ${theme.textColor} 5%, ${theme.backgroundColor})`
      : theme.secondaryColor,
  } as CSSProperties;
}
