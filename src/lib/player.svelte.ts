import type { Book } from "./books";
import { loadPlayerState, savePlayerStateToDb, updateBookLastPlayed } from "./db";

export const player = $state({
  book: null as Book | null,
  currentIndex: 0,
  isPlaying: false,
  progress: 0,
  volume: 80,
  /** "bookId_chapterIndex" → позиция в секундах */
  chapterProgress: {} as Record<string, number>,
  /** bookId → unix timestamp последнего воспроизведения */
  lastPlayed: {} as Record<string, number>,
});

function chapterKey(bookId: string, index: number) {
  return `${bookId}_${index}`;
}

/** Сохраняем текущую позицию в map перед переключением */
function flushCurrentProgress() {
  if (player.book) {
    player.chapterProgress[chapterKey(player.book.id, player.currentIndex)] =
      player.progress;
  }
}

/** Обновляем player.progress из map для новой главы */
function restoreChapterProgress(bookId: string, index: number) {
  const saved = player.chapterProgress[chapterKey(bookId, index)] ?? 0;
  const duration = player.book?.chapters[index]?.duration ?? 0;
  if (duration > 0 && saved / duration >= 0.95) {
    player.progress = Math.max(0, duration - 10);
  } else {
    player.progress = saved;
  }
}

export async function savePlayerState() {
  if (!player.book) return;
  try {
    await savePlayerStateToDb({
      bookId: player.book.id,
      currentIndex: player.currentIndex,
      progress: player.progress,
      volume: player.volume,
      chapterProgress: player.chapterProgress,
    });
  } catch (e) {
    console.error("[player] failed to save state:", e);
  }
}

export async function restorePlayerState(books: Book[]) {
  try {
    const saved = await loadPlayerState();
    if (!saved) return;
    const book = books.find((b) => b.id === saved.bookId);
    if (!book) return;
    player.chapterProgress = saved.chapterProgress ?? {};
    player.book = book;
    player.currentIndex = Math.min(
      saved.currentIndex,
      book.chapters.length - 1,
    );
    player.progress = saved.progress;
    player.volume = saved.volume;
    player.isPlaying = true;
  } catch (e) {
    console.error("[player] failed to restore state:", e);
  }
}

/** Вызывается из PlayerBar при каждом обновлении currentTime */
export function updateProgress(seconds: number) {
  player.progress = seconds;
  if (player.book) {
    player.chapterProgress[chapterKey(player.book.id, player.currentIndex)] =
      seconds;
  }
}

export function playChapter(book: Book, index: number) {
  flushCurrentProgress();
  player.book = book;
  player.currentIndex = index;
  restoreChapterProgress(book.id, index);
  player.isPlaying = true;
  player.lastPlayed = { ...player.lastPlayed, [book.id]: Math.floor(Date.now() / 1000) };
  updateBookLastPlayed(book.id); // fire-and-forget
}

export function togglePlay() {
  player.isPlaying = !player.isPlaying;
}

export function skipPrev() {
  if (!player.book) return;
  flushCurrentProgress();
  if (player.progress > 5) {
    player.progress = 0;
    player.chapterProgress[chapterKey(player.book.id, player.currentIndex)] = 0;
  } else if (player.currentIndex > 0) {
    player.currentIndex--;
    restoreChapterProgress(player.book.id, player.currentIndex);
  }
}

export function skipNext() {
  if (!player.book) return;
  flushCurrentProgress();
  if (player.currentIndex < player.book.chapters.length - 1) {
    player.currentIndex++;
    restoreChapterProgress(player.book.id, player.currentIndex);
  } else {
    player.isPlaying = false;
    player.progress = 0;
  }
}
