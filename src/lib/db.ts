import Database from "@tauri-apps/plugin-sql";
import type { Book, Chapter } from "./books";

let db: Database | null = null;

export async function initDb(): Promise<void> {
  db = await Database.load("sqlite:reads.db");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover TEXT NOT NULL DEFAULT '',
      cover_is_image INTEGER NOT NULL DEFAULT 0,
      year INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      book_id TEXT NOT NULL,
      chapter_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0,
      file_path TEXT,
      PRIMARY KEY (book_id, chapter_id),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS covers (
      book_id TEXT PRIMARY KEY,
      data_url TEXT NOT NULL
    )
  `);

  try {
    await db.execute(
      "ALTER TABLE books ADD COLUMN last_played_at INTEGER NOT NULL DEFAULT 0"
    );
  } catch {} // column already exists — ignore

  await db.execute(`
    CREATE TABLE IF NOT EXISTS player_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      book_id TEXT,
      current_index INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0,
      volume INTEGER NOT NULL DEFAULT 80,
      chapter_progress TEXT NOT NULL DEFAULT '{}'
    )
  `);
}

function getDb(): Database {
  if (!db) throw new Error("DB not initialized");
  return db;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function loadSetting(key: string): Promise<string | null> {
  const rows = await getDb().select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = $1",
    [key]
  );
  return rows.length > 0 ? rows[0].value : null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await getDb().execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}

// ── Books ─────────────────────────────────────────────────────────────────────

interface BookRow {
  id: string;
  title: string;
  author: string;
  cover: string;
  cover_is_image: number;
  year: number;
}

interface ChapterRow {
  book_id: string;
  chapter_id: number;
  title: string;
  duration: number;
  file_path: string | null;
}

interface CoverRow {
  book_id: string;
  data_url: string;
}

export async function loadAllBooks(): Promise<Book[]> {
  const d = getDb();
  const bookRows = await d.select<BookRow[]>("SELECT * FROM books");
  if (bookRows.length === 0) return [];

  const chapterRows = await d.select<ChapterRow[]>(
    "SELECT * FROM chapters ORDER BY book_id, chapter_id"
  );
  const coverRows = await d.select<CoverRow[]>("SELECT * FROM covers");

  const chaptersByBook: Record<string, Chapter[]> = {};
  for (const row of chapterRows) {
    if (!chaptersByBook[row.book_id]) chaptersByBook[row.book_id] = [];
    chaptersByBook[row.book_id].push({
      id: row.chapter_id,
      title: row.title,
      duration: row.duration,
      filePath: row.file_path ?? undefined,
    });
  }

  const coverByBook: Record<string, string> = {};
  for (const row of coverRows) {
    coverByBook[row.book_id] = row.data_url;
  }

  return bookRows.map((row) => {
    const imageCover = coverByBook[row.id];
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      cover: imageCover ?? row.cover,
      coverIsImage: imageCover !== undefined || row.cover_is_image === 1,
      year: row.year,
      chapters: chaptersByBook[row.id] ?? [],
    };
  });
}

export async function upsertBook(book: Book): Promise<void> {
  const d = getDb();

  // Separate image cover from the book row
  const isImage = book.coverIsImage && book.cover.startsWith("data:");
  const coverValue = isImage ? "" : book.cover;

  await d.execute(
    `INSERT INTO books (id, title, author, cover, cover_is_image, year)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       author = excluded.author,
       cover = excluded.cover,
       cover_is_image = excluded.cover_is_image,
       year = excluded.year`,
    [book.id, book.title, book.author, coverValue, isImage ? 1 : 0, book.year]
  );

  // Replace chapters
  await d.execute("DELETE FROM chapters WHERE book_id = $1", [book.id]);
  for (const ch of book.chapters) {
    await d.execute(
      `INSERT INTO chapters (book_id, chapter_id, title, duration, file_path)
       VALUES ($1, $2, $3, $4, $5)`,
      [book.id, ch.id, ch.title, ch.duration, ch.filePath ?? null]
    );
  }

  // Save image cover separately
  if (isImage) {
    await d.execute(
      `INSERT INTO covers (book_id, data_url) VALUES ($1, $2)
       ON CONFLICT(book_id) DO UPDATE SET data_url = excluded.data_url`,
      [book.id, book.cover]
    );
  }
}

export async function loadLastPlayedMap(): Promise<Record<string, number>> {
  const rows = await getDb().select<{ id: string; last_played_at: number }[]>(
    "SELECT id, last_played_at FROM books"
  );
  const map: Record<string, number> = {};
  for (const r of rows) map[r.id] = r.last_played_at;
  return map;
}

export async function updateBookLastPlayed(bookId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await getDb().execute(
    "UPDATE books SET last_played_at = $1 WHERE id = $2",
    [now, bookId]
  );
}

export async function deleteBook(id: string): Promise<void> {
  const d = getDb();
  await d.execute("DELETE FROM covers WHERE book_id = $1", [id]);
  await d.execute("DELETE FROM chapters WHERE book_id = $1", [id]);
  await d.execute("DELETE FROM books WHERE id = $1", [id]);
}

export async function saveBookCover(bookId: string, dataUrl: string): Promise<void> {
  const d = getDb();
  await d.execute(
    `INSERT INTO covers (book_id, data_url) VALUES ($1, $2)
     ON CONFLICT(book_id) DO UPDATE SET data_url = excluded.data_url`,
    [bookId, dataUrl]
  );
  await d.execute(
    "UPDATE books SET cover = '', cover_is_image = 1 WHERE id = $1",
    [bookId]
  );
}

// ── Player state ──────────────────────────────────────────────────────────────

export interface SavedState {
  bookId: string;
  currentIndex: number;
  progress: number;
  volume: number;
  chapterProgress: Record<string, number>;
}

export async function loadPlayerState(): Promise<SavedState | null> {
  const rows = await getDb().select<{
    book_id: string | null;
    current_index: number;
    progress: number;
    volume: number;
    chapter_progress: string;
  }[]>("SELECT * FROM player_state WHERE id = 1");

  if (rows.length === 0 || !rows[0].book_id) return null;
  const row = rows[0];
  return {
    bookId: row.book_id!,
    currentIndex: row.current_index,
    progress: row.progress,
    volume: row.volume,
    chapterProgress: JSON.parse(row.chapter_progress),
  };
}

export async function savePlayerStateToDb(state: SavedState): Promise<void> {
  await getDb().execute(
    `INSERT INTO player_state (id, book_id, current_index, progress, volume, chapter_progress)
     VALUES (1, $1, $2, $3, $4, $5)
     ON CONFLICT(id) DO UPDATE SET
       book_id = excluded.book_id,
       current_index = excluded.current_index,
       progress = excluded.progress,
       volume = excluded.volume,
       chapter_progress = excluded.chapter_progress`,
    [
      state.bookId,
      state.currentIndex,
      state.progress,
      state.volume,
      JSON.stringify(state.chapterProgress),
    ]
  );
}
