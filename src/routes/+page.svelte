<script lang="ts">
    import { goto } from "$app/navigation";
    import { library, addBook, removeBook } from "$lib/libraryStore.svelte";
    import { player } from "$lib/player.svelte";
    import { importBookFromFolder } from "$lib/importBook";

    let importing = $state(false);

    async function handleImport() {
        importing = true;
        try {
            const book = await importBookFromFolder();
            if (book) addBook(book);
        } finally {
            importing = false;
        }
    }

    function handleDelete(e: MouseEvent, bookId: string) {
        e.stopPropagation();
        if (player.book?.id === bookId) {
            player.book = null;
            player.isPlaying = false;
        }
        removeBook(bookId);
    }

    /** Сколько глав прослушано ≥95% */
    function doneCount(bookId: string, chaptersLen: number): number {
        let n = 0;
        // Нужна длительность — берём из library
        const book = library.books.find(b => b.id === bookId);
        if (!book) return 0;
        for (let i = 0; i < chaptersLen; i++) {
            const dur = book.chapters[i].duration;
            if (!dur) continue;
            const prog = player.chapterProgress[`${bookId}_${i}`] ?? 0;
            if (prog / dur >= 0.95) n++;
        }
        return n;
    }
</script>

<div class="library">
    <div class="toolbar">
        <p class="subtitle">Аудиокниги</p>
        <button class="import-btn" onclick={handleImport} disabled={importing}>
            {#if importing}
                <span class="spinner"></span>
            {:else}
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
            {/if}
            Добавить книгу
        </button>
    </div>

    <div class="grid">
        {#each library.books as book (book.id)}
            {@const done = doneCount(book.id, book.chapters.length)}
            {@const pct = book.chapters.length ? Math.round(done / book.chapters.length * 100) : 0}
            <div class="card" role="button" tabindex="0"
                onclick={() => goto(`/book/${book.id}`)}
                onkeydown={(e) => e.key === 'Enter' && goto(`/book/${book.id}`)}>

                <div
                    class="cover"
                    class:cover-image={book.coverIsImage}
                    style={book.coverIsImage
                        ? `background-image: url('${book.cover}')`
                        : `background: ${book.cover}`}
                >
                    <!-- Прогресс-полоска -->
                    {#if pct > 0}
                        <div class="progress-bar" style="width: {pct}%"></div>
                    {/if}

                    <button
                        class="delete-btn"
                        onclick={(e) => handleDelete(e, book.id)}
                        title="Удалить книгу"
                        aria-label="Удалить книгу"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <div class="info">
                    <span class="title">{book.title}</span>
                    <span class="author">{book.author}</span>
                    {#if done > 0}
                        <span class="progress-label">{done} из {book.chapters.length} глав</span>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .library {
        padding: 20px 24px 24px;
        height: 100%;
        overflow-y: auto;
    }

    /* ── Toolbar ─── */
    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
    }

    .subtitle {
        font-size: var(--text-md);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #79747e;
    }

    .import-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: 20px;
        border: none;
        background: #5c6bc0;
        color: #fff;
        font-size: var(--text-base);
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
    }

    .import-btn:hover  { background: #3f51b5; }
    .import-btn:active { transform: scale(0.97); }
    .import-btn:disabled { opacity: 0.6; cursor: default; }
    .import-btn svg { width: 18px; height: 18px; }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.35);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Grid ─── */
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
        gap: 16px;
    }

    /* ── Card ─── */
    .card {
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        text-align: left;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        transition: box-shadow 0.2s, transform 0.2s;
        position: relative;
    }

    .card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
        transform: translateY(-2px);
    }

    .card:active {
        transform: translateY(0);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
    }

    /* ── Cover ─── */
    .cover {
        aspect-ratio: 2 / 3;
        position: relative;
        display: flex;
        align-items: flex-end;
        border-radius: 12px 12px 0 0;
        overflow: hidden;
    }

    .cover-image {
        background-size: cover;
        background-position: center;
    }

    /* Прогресс-полоска внизу обложки */
    .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 0 2px 0 0;
        transition: width 0.3s;
    }

    /* ── Кнопка удаления ─── */
    .delete-btn {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        opacity: 0;
        transform: scale(0.8);
        transition: opacity 0.15s, transform 0.15s, background 0.12s;
    }

    .delete-btn svg { width: 14px; height: 14px; }

    .card:hover .delete-btn {
        opacity: 1;
        transform: scale(1);
    }

    .delete-btn:hover { background: #c62828; }
    .delete-btn:active { transform: scale(0.9); }

    /* ── Info ─── */
    .info {
        padding: 10px 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .title {
        font-size: var(--text-lg);
        font-weight: 600;
        color: #1c1b1f;
        line-height: 1.35;
        min-height: calc(1.35em * 2);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .author {
        font-size: var(--text-xs);
        color: #79747e;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .progress-label {
        font-size: var(--text-2xs);
        color: #5c6bc0;
        font-weight: 500;
        margin-top: 2px;
    }
</style>
