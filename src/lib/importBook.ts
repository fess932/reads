import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Book } from "./books";

async function readImageAsDataUrl(filePath: string): Promise<string> {
  return await invoke<string>("read_file_base64", { path: filePath });
}

interface FileEntry {
  name: string;
  is_dir: boolean;
}

const AUDIO_EXTS = ["mp3", "m4a", "m4b", "ogg", "flac", "wav", "aac", "opus"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];
const COVER_NAMES = ["cover", "folder", "front", "artwork", "album", "art"];

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isAudio(name: string) {
  return AUDIO_EXTS.includes(ext(name));
}

function isImage(name: string) {
  return IMAGE_EXTS.includes(ext(name));
}

function isCoverName(name: string) {
  const base = name.toLowerCase().replace(/\.[^.]+$/, "");
  return COVER_NAMES.some((n) => base === n || base.startsWith(n));
}

function parseFolderName(name: string): { title: string; author: string } {
  const m = name.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (m) return { author: m[1].trim(), title: m[2].trim() };
  return { title: name, author: "" };
}

function parseChapterTitle(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[\s.\-_]+/, "")
    .trim() || name.replace(/\.[^.]+$/, "");
}

function hashGradient(s: string): string {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(160deg, hsl(${hue},50%,25%) 0%, hsl(${(hue + 40) % 360},60%,35%) 100%)`;
}

function getAudioDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(Math.round(audio.duration) || 0);
      audio.src = "";
    };
    audio.onerror = () => resolve(0);
    audio.src = src;
  });
}

export async function importBookFromFolder(): Promise<Book | null> {
  const folderPath = await open({ directory: true, multiple: false });
  if (!folderPath || typeof folderPath !== "string") return null;

  const entries: FileEntry[] = await invoke("scan_folder", { path: folderPath });

  const audioEntries = entries.filter((e) => !e.is_dir && isAudio(e.name));
  if (audioEntries.length === 0) return null;

  const imageEntries = entries.filter((e) => !e.is_dir && isImage(e.name));
  const coverEntry =
    imageEntries.find((e) => isCoverName(e.name)) ?? imageEntries[0];

  const folderName = folderPath.split(/[\\/]/).pop() ?? "Unknown";
  const { title, author } = parseFolderName(folderName);

  // Build chapters with real durations (parallel)
  const chapters = await Promise.all(
    audioEntries.map(async (e, i) => {
      const filePath = await join(folderPath, e.name);
      const duration = await getAudioDuration(convertFileSrc(filePath));
      return {
        id: i + 1,
        title: parseChapterTitle(e.name),
        duration,
        filePath,
      };
    })
  );

  let cover: string;
  let coverIsImage = false;
  if (coverEntry) {
    const coverPath = await join(folderPath, coverEntry.name);
    cover = await readImageAsDataUrl(coverPath);
    coverIsImage = true;
  } else {
    cover = hashGradient(title);
  }

  return {
    id: `imported-${Date.now()}`,
    title,
    author,
    cover,
    coverIsImage,
    year: new Date().getFullYear(),
    chapters,
  };
}
