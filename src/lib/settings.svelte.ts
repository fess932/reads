import { initDb, loadSetting, saveSetting } from "./db";

export type FontSize = "normal" | "large" | "xlarge";

export const settings = $state<{ fontSize: FontSize; serperApiKey: string }>({
  fontSize: "normal",
  serperApiKey: "",
});

export async function initSettings() {
  await initDb();
  const fontSize = await loadSetting("fontSize");
  const serperApiKey = await loadSetting("serperApiKey");
  if (fontSize) settings.fontSize = fontSize as FontSize;
  if (serperApiKey) settings.serperApiKey = serperApiKey;
}

export async function saveSettings() {
  await saveSetting("fontSize", settings.fontSize);
  await saveSetting("serperApiKey", settings.serperApiKey);
}

export function setFontSize(size: FontSize) {
  settings.fontSize = size;
  saveSettings();
}

export function setSerperApiKey(key: string) {
  settings.serperApiKey = key.trim();
  saveSettings();
}

/** Returns CSS custom properties for the current font size preset */
export function fontSizeVars(size: FontSize): string {
  const scales: Record<FontSize, number[]> = {
    //          2xs  xs   sm   md   base  lg
    normal: [10, 11, 12, 13, 14, 15],
    large: [12, 13, 14, 15, 16, 17],
    xlarge: [16, 17, 18, 19, 20, 21],
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
