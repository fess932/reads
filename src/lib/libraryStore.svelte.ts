import { type Book } from "./books";
import { loadAllBooks, upsertBook, deleteBook, saveBookCover } from "./db";
import { restorePlayerState } from "./player.svelte";

// ── Store ─────────────────────────────────────────────────────────────────────

export const library = $state<{ books: Book[] }>({
  books: [],
});

export async function initLibrary() {
  library.books = await loadAllBooks();
  await restorePlayerState(library.books);
}

export async function addBook(book: Book) {
  await upsertBook(book);
  library.books = [...library.books, book];
}

export function getBook(id: string): Book | undefined {
  return library.books.find((b) => b.id === id);
}

export async function removeBook(id: string) {
  await deleteBook(id);
  library.books = library.books.filter((b) => b.id !== id);
}

export async function updateBookCover(bookId: string, cover: string) {
  await saveBookCover(bookId, cover);
  library.books = library.books.map((b) =>
    b.id === bookId ? { ...b, cover, coverIsImage: true } : b
  );
}
