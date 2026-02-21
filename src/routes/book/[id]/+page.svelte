<script lang="ts">
    import { goto } from "$app/navigation";
    import { formatTime } from "$lib/books";
    import { player, playChapter } from "$lib/player.svelte";
    import { updateBookCover } from "$lib/libraryStore.svelte";
    import CoverPicker from "$lib/CoverPicker.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const { book } = data;

    let showCoverPicker = $state(false);

    async function onCoverSelected(dataUrl: string) {
        await updateBookCover(book.id, dataUrl);
        book.cover = dataUrl;
        book.coverIsImage = true;
        showCoverPicker = false;
    }

    function isActive(index: number) {
        return player.book?.id === book.id && player.currentIndex === index;
    }

    function isPlayingChapter(index: number) {
        return isActive(index) && player.isPlaying;
    }

    function isDone(index: number): boolean {
        const dur = book.chapters[index].duration;
        if (!dur) return false;
        const prog = player.chapterProgress[`${book.id}_${index}`] ?? 0;
        return prog / dur >= 0.95;
    }
</script>

<div class="page">
    <!-- Book header -->
    <div class="book-header">
        <button class="back-btn" onclick={() => goto("/")}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                    d="M19 12H5M5 12l7-7M5 12l7 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </button>
        <div class="cover-wrap">
            <div
                class="cover-small"
                class:cover-image={book.coverIsImage}
                style={book.coverIsImage
                    ? `background-image: url('${book.cover}')`
                    : `background: ${book.cover}`}
            ></div>
            <button
                class="edit-cover-btn"
                onclick={() => (showCoverPicker = true)}
                title="Сменить обложку"
                aria-label="Сменить обложку"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
            </button>
        </div>
        <div class="book-meta">
            <h1 class="book-title">{book.title}</h1>
            <p class="book-author">{book.author}</p>
            <p class="book-sub">{book.chapters.length} глав · {book.year}</p>
        </div>
    </div>

    <!-- Cover picker modal -->
    {#if showCoverPicker}
        <CoverPicker
            bookTitle={book.title}
            bookAuthor={book.author}
            onSelect={onCoverSelected}
            onClose={() => (showCoverPicker = false)}
        />
    {/if}

    <!-- Chapter list -->
    <div class="section-label">Главы</div>
    <div class="chapter-list">
        {#each book.chapters as chapter, i}
            <button
                class="chapter-row"
                class:active={isActive(i)}
                class:done={isDone(i)}
                onclick={() => playChapter(book, i)}
            >
                <span class="chapter-num">
                    {#if isDone(i)}
                        <svg class="check-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                    {:else}
                        {chapter.id}
                    {/if}
                </span>
                <span class="chapter-title">{chapter.title}</span>
                <span class="chapter-dur">{formatTime(chapter.duration)}</span>
                {#if isPlayingChapter(i)}
                    <span class="playing-dot"></span>
                {/if}
            </button>
        {/each}
    </div>
</div>

<style>
    .page {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #fafafa;
        overflow-y: auto;
    }

    /* ── Book header ─── */
    .book-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        background: #fff;
        border-bottom: 1px solid #ececec;
        flex-shrink: 0;
    }

    .back-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #49454f;
        padding: 0;
        flex-shrink: 0;
        transition: background 0.15s;
    }

    .back-btn:hover { background: rgba(0, 0, 0, 0.07); }
    .back-btn svg { width: 20px; height: 20px; }

    .cover-wrap {
        position: relative;
        flex-shrink: 0;
    }

    .cover-small {
        width: 48px;
        height: 64px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .cover-image {
        background-size: cover;
        background-position: center;
    }

    .edit-cover-btn {
        position: absolute;
        inset: 0;
        border-radius: 6px;
        border: none;
        background: rgba(0, 0, 0, 0);
        color: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        transition: background 0.15s, color 0.15s;
    }

    .edit-cover-btn svg {
        width: 18px;
        height: 18px;
        filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
    }

    .cover-wrap:hover .edit-cover-btn {
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
    }

    .book-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .book-title {
        font-size: var(--text-lg);
        font-weight: 600;
        color: #1c1b1f;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .book-author {
        font-size: var(--text-md);
        color: #49454f;
    }

    .book-sub {
        font-size: var(--text-sm);
        color: #79747e;
        margin-top: 2px;
    }

    /* ── Chapter list ─── */
    .section-label {
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #79747e;
        padding: 16px 20px 8px;
        flex-shrink: 0;
    }

    .chapter-list {
        display: flex;
        flex-direction: column;
    }

    .chapter-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 20px;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        transition: background 0.12s;
    }

    .chapter-row:hover { background: rgba(0, 0, 0, 0.04); }
    .chapter-row.active { background: #ede7f6; }

    .chapter-num {
        font-size: var(--text-sm);
        font-weight: 600;
        color: #79747e;
        width: 20px;
        flex-shrink: 0;
        text-align: center;
    }

    .chapter-row.active .chapter-num { color: #5c6bc0; }

    .chapter-row.done .chapter-num { color: #43a047; }
    .chapter-row.done .chapter-title { color: #79747e; }
    .chapter-row.done .chapter-dur  { color: #b0b0b0; }

    .check-icon {
        width: 15px;
        height: 15px;
        display: block;
    }

    .chapter-title {
        flex: 1;
        font-size: var(--text-base);
        color: #1c1b1f;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chapter-row.active .chapter-title {
        color: #311b92;
        font-weight: 500;
    }

    .chapter-dur {
        font-size: var(--text-sm);
        color: #79747e;
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
    }

    .playing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #5c6bc0;
        flex-shrink: 0;
        animation: pulse 1.2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
    }
</style>
