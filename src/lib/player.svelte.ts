import type { Book } from "./books";

export const player = $state({
  book: null as Book | null,
  currentIndex: 0,
  isPlaying: false,
  progress: 0,
  volume: 80,
});

export function playChapter(book: Book, index: number) {
  player.book = book;
  player.currentIndex = index;
  player.progress = 0;
  player.isPlaying = true;
}

export function togglePlay() {
  player.isPlaying = !player.isPlaying;
}

export function skipPrev() {
  if (player.progress > 5) {
    player.progress = 0;
  } else if (player.currentIndex > 0) {
    player.currentIndex--;
    player.progress = 0;
  }
}

export function skipNext() {
  if (!player.book) return;
  if (player.currentIndex < player.book.chapters.length - 1) {
    player.currentIndex++;
    player.progress = 0;
  } else {
    player.isPlaying = false;
    player.progress = 0;
  }
}
