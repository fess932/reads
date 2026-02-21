export interface Chapter {
  id: number;
  title: string;
  duration: number; // seconds
  filePath?: string; // only for imported books
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string; // CSS gradient OR asset URL for image
  coverIsImage?: boolean;
  year: number;
  chapters: Chapter[];
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
