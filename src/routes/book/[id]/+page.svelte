<script lang="ts">
    import { goto } from "$app/navigation";
    import { formatTime } from "$lib/books";
    import { player, playChapter } from "$lib/player.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const { book } = data;

    function isActive(index: number) {
        return player.book?.id === book.id && player.currentIndex === index;
    }

    function isPlayingChapter(index: number) {
        return isActive(index) && player.isPlaying;
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
        <div class="cover-small" style="background: {book.cover}"></div>
        <div class="book-meta">
            <h1 class="book-title">{book.title}</h1>
            <p class="book-author">{book.author}</p>
            <p class="book-sub">{book.chapters.length} глав · {book.year}</p>
        </div>
    </div>

    <!-- Chapter list -->
    <div class="section-label">Главы</div>
    <div class="chapter-list">
        {#each book.chapters as chapter, i}
            <button
                class="chapter-row"
                class:active={isActive(i)}
                onclick={() => playChapter(book, i)}
            >
                <span class="chapter-num">{chapter.id}</span>
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

    .cover-small {
        width: 48px;
        height: 64px;
        border-radius: 6px;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .book-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .book-title {
        font-size: 15px;
        font-weight: 600;
        color: #1c1b1f;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .book-author {
        font-size: 13px;
        color: #49454f;
    }

    .book-sub {
        font-size: 12px;
        color: #79747e;
        margin-top: 2px;
    }

    /* ── Chapter list ─── */
    .section-label {
        font-size: 11px;
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
        font-size: 12px;
        font-weight: 600;
        color: #79747e;
        width: 20px;
        flex-shrink: 0;
        text-align: center;
    }

    .chapter-row.active .chapter-num { color: #5c6bc0; }

    .chapter-title {
        flex: 1;
        font-size: 14px;
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
        font-size: 12px;
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
