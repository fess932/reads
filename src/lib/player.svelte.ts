import type { Book } from "./books";

const PLAYER_KEY = "reads-player";

interface SavedState {
  bookId: string;
  currentIndex: number;
  progress: number;
  volume: number;
  chapterProgress: Record<string, number>;
}

export const player = $state({
  book: null as Book | null,
  currentIndex: 0,
  isPlaying: false,
  progress: 0,
  volume: 80,
  /** "bookId_chapterIndex" → позиция в секундах */
  chapterProgress: {} as Record<string, number>,
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
  player.progress = player.chapterProgress[chapterKey(bookId, index)] ?? 0;
}

export function savePlayerState() {
  if (!player.book) return;
  const state: SavedState = {
    bookId: player.book.id,
    currentIndex: player.currentIndex,
    progress: player.progress,
    volume: player.volume,
    chapterProgress: player.chapterProgress,
  };
  localStorage.setItem(PLAYER_KEY, JSON.stringify(state));
}

export function restorePlayerState(books: Book[]) {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return;
    const saved: SavedState = JSON.parse(raw);
    const book = books.find((b) => b.id === saved.bookId);
    if (!book) return;
    player.chapterProgress = saved.chapterProgress ?? {};
    player.book = book;
    player.currentIndex = Math.min(saved.currentIndex, book.chapters.length - 1);
    player.progress = saved.progress;
    player.volume = saved.volume;
    player.isPlaying = true;
  } catch {
    // ignore corrupt state
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
