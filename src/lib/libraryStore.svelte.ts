import { type Book } from "./books";
import { restorePlayerState } from "./player.svelte";

const STORAGE_KEY = "reads-imported-books";

function loadImported(): Book[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveImported(books: Book[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export const library = $state<{ books: Book[] }>({
  books: [],
});

// Initialise after DOM is ready (localStorage not available during SSR)
export function initLibrary() {
  library.books = loadImported();
  restorePlayerState(library.books);
}

export function addBook(book: Book) {
  library.books = [...library.books, book];
  const imported = library.books.filter((b) => b.id.startsWith("imported-"));
  saveImported(imported);
}

export function getBook(id: string): Book | undefined {
  return library.books.find((b) => b.id === id);
}

export function removeBook(id: string) {
  library.books = library.books.filter((b) => b.id !== id);
  const imported = library.books.filter((b) => b.id.startsWith("imported-"));
  saveImported(imported);
}
