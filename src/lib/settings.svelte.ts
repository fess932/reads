const SETTINGS_KEY = "reads-settings";

export type FontSize = "normal" | "large" | "xlarge";

export const settings = $state<{ fontSize: FontSize }>({
  fontSize: "normal",
});

export function initSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.fontSize) settings.fontSize = saved.fontSize;
  } catch {
    // ignore
  }
}

export function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fontSize: settings.fontSize }));
}

export function setFontSize(size: FontSize) {
  settings.fontSize = size;
  saveSettings();
}

/** Returns CSS custom properties for the current font size preset */
export function fontSizeVars(size: FontSize): string {
  const scales: Record<FontSize, number[]> = {
    //          2xs  xs   sm   md   base  lg
    normal: [10, 11, 12, 13, 14, 15],
    large:  [12, 13, 14, 15, 16, 17],
    xlarge: [14, 15, 16, 17, 18, 19],
  };
  const [twoXs, xs, sm, md, base, lg] = scales[size];
  return [
    `--text-2xs:${twoXs}px`,
    `--text-xs:${xs}px`,
    `--text-sm:${sm}px`,
    `--text-md:${md}px`,
    `--text-base:${base}px`,
    `--text-lg:${lg}px`,
  ].join(";");
}
