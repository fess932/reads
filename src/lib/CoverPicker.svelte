<script lang="ts">
    import { onMount } from "svelte";
    import { invoke } from "@tauri-apps/api/core";

    let {
        bookTitle,
        bookAuthor,
        onSelect,
        onClose,
    }: {
        bookTitle: string;
        bookAuthor: string;
        onSelect: (coverDataUrl: string) => void;
        onClose: () => void;
    } = $props();

    interface CoverResult {
        id: string;
        title: string;
        thumbnail: string;
        full: string;
        source: "itunes" | "google";
    }

    const initialQuery = [bookTitle, bookAuthor].filter(Boolean).join(" ");
    let query = $state(initialQuery);
    let results = $state<CoverResult[]>([]);
    let loading = $state(false);
    let selecting = $state<string | null>(null); // id картинки которую качаем
    let error = $state("");

    // ── iTunes Search (аудиокниги + электронные книги) ────────────────────────
    async function searchITunes(q: string): Promise<CoverResult[]> {
        const [r1, r2] = await Promise.allSettled([
            fetch(
                `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=audiobook&limit=15&country=us`
            ).then((r) => r.json()),
            fetch(
                `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=ebook&limit=10&country=us`
            ).then((r) => r.json()),
        ]);

        const items = [
            ...(r1.status === "fulfilled" ? r1.value.results ?? [] : []),
            ...(r2.status === "fulfilled" ? r2.value.results ?? [] : []),
        ];

        return items
            .filter((it: Record<string, unknown>) => it.artworkUrl100)
            .map((it: Record<string, unknown>) => {
                const art = (it.artworkUrl100 as string).replace(
                    /\d+x\d+bb/,
                    "600x600bb"
                );
                const thumb = (it.artworkUrl100 as string).replace(
                    /\d+x\d+bb/,
                    "300x300bb"
                );
                return {
                    id: `itunes-${it.collectionId ?? it.trackId}`,
                    title: (it.collectionName as string) ?? (it.trackName as string) ?? "",
                    thumbnail: thumb,
                    full: art,
                    source: "itunes" as const,
                };
            });
    }

    // ── Google Books ──────────────────────────────────────────────────────────
    async function searchGoogle(q: string): Promise<CoverResult[]> {
        const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=15&printType=books`
        );
        const data = await res.json();

        return ((data.items as Record<string, unknown>[]) ?? [])
            .filter((it) => {
                const vi = it.volumeInfo as Record<string, unknown>;
                const links = vi?.imageLinks as Record<string, string> | undefined;
                return links?.thumbnail;
            })
            .map((it) => {
                const vi = it.volumeInfo as Record<string, unknown>;
                const links = vi.imageLinks as Record<string, string>;
                const thumb = links.thumbnail.replace("http://", "https://");
                const full = links.thumbnail
                    .replace("http://", "https://")
                    .replace("zoom=1", "zoom=3")
                    .replace("&edge=curl", "");
                return {
                    id: `google-${it.id}`,
                    title: (vi.title as string) ?? "",
                    thumbnail: thumb,
                    full,
                    source: "google" as const,
                };
            });
    }

    // ── Объединённый поиск ────────────────────────────────────────────────────
    async function search() {
        const q = query.trim();
        if (!q) return;
        loading = true;
        error = "";
        results = [];

        const [itunesRes, googleRes] = await Promise.allSettled([
            searchITunes(q),
            searchGoogle(q),
        ]);

        const itunes = itunesRes.status === "fulfilled" ? itunesRes.value : [];
        const google = googleRes.status === "fulfilled" ? googleRes.value : [];

        // iTunes первыми — у них лучшее качество для аудиокниг
        const seen = new Set<string>();
        const combined: CoverResult[] = [];
        for (const r of [...itunes, ...google]) {
            const key = r.title.toLowerCase().slice(0, 40);
            if (!seen.has(key) && combined.length < 15) {
                seen.add(key);
                combined.push(r);
            }
        }

        results = combined;
        if (results.length === 0) {
            error =
                itunesRes.status === "rejected" && googleRes.status === "rejected"
                    ? "Ошибка подключения к интернету"
                    : "Ничего не найдено. Попробуйте другой запрос.";
        }
        loading = false;
    }

    // ── Скачать обложку через Rust (обходит CORS) ─────────────────────────────
    async function pickCover(r: CoverResult) {
        selecting = r.id;
        error = "";
        try {
            const dataUrl = await invoke<string>("download_image", { url: r.full });
            onSelect(dataUrl);
        } catch (e) {
            error = `Не удалось загрузить обложку: ${e}`;
            selecting = null;
        }
    }

    function onBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    function onInputKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") search();
    }

    onMount(() => {
        search();
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onBackdropClick}>
    <div class="modal" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="header">
            <span class="title">Выбор обложки</span>
            <button class="close-btn" onclick={onClose} aria-label="Закрыть">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>

        <!-- Search -->
        <div class="search-row">
            <input
                class="search-input"
                type="text"
                bind:value={query}
                placeholder="Название книги, автор…"
                onkeydown={onInputKeydown}
                disabled={loading || !!selecting}
            />
            <button
                class="search-btn"
                onclick={search}
                disabled={loading || !!selecting || !query.trim()}
            >
                {#if loading}
                    <span class="spinner"></span>
                {:else}
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                {/if}
                Найти
            </button>
        </div>

        <!-- Body -->
        <div class="body">
            {#if selecting}
                <div class="state-center">
                    <span class="spinner spinner-dark"></span>
                    <span class="state-text">Загружаю обложку…</span>
                </div>
            {:else if loading}
                <div class="state-center">
                    <span class="spinner spinner-dark"></span>
                    <span class="state-text">Поиск…</span>
                </div>
            {:else if error && results.length === 0}
                <div class="state-center">
                    <span class="state-text error">{error}</span>
                </div>
            {:else if results.length === 0}
                <div class="state-center">
                    <span class="state-text muted">Введите название и нажмите «Найти»</span>
                </div>
            {:else}
                {#if error}
                    <p class="error-banner">{error}</p>
                {/if}
                <div class="grid">
                    {#each results as r (r.id)}
                        <button
                            class="card"
                            onclick={() => pickCover(r)}
                            title={r.title}
                            disabled={!!selecting}
                        >
                            <div class="card-img-wrap">
                                <img
                                    src={r.thumbnail}
                                    alt={r.title}
                                    loading="lazy"
                                />
                                <span class="badge badge-{r.source}">
                                    {r.source === "itunes" ? "iTunes" : "Google"}
                                </span>
                            </div>
                            <span class="card-title">{r.title}</span>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <p class="attribution">
            Источники: Apple iTunes · Google Books
        </p>
    </div>
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    }

    .modal {
        background: #fff;
        border-radius: 16px;
        width: 100%;
        max-width: 540px;
        max-height: calc(100vh - 40px);
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
        overflow: hidden;
    }

    /* Header */
    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 12px;
        border-bottom: 1px solid #ececec;
        flex-shrink: 0;
    }
    .title {
        font-size: 15px;
        font-weight: 600;
        color: #1c1b1f;
    }
    .close-btn {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #49454f;
        padding: 0;
        transition: background 0.12s;
    }
    .close-btn:hover { background: rgba(0,0,0,0.07); }
    .close-btn svg { width: 18px; height: 18px; }

    /* Search */
    .search-row {
        display: flex;
        gap: 8px;
        padding: 10px 14px;
        flex-shrink: 0;
    }
    .search-input {
        flex: 1;
        height: 36px;
        border: 1.5px solid #e0e0e0;
        border-radius: 9px;
        padding: 0 11px;
        font-size: 13px;
        color: #1c1b1f;
        outline: none;
        background: #fafafa;
        transition: border-color 0.15s;
    }
    .search-input:focus { border-color: #5c6bc0; background: #fff; }
    .search-input:disabled { opacity: 0.55; }

    .search-btn {
        height: 36px;
        padding: 0 13px;
        border-radius: 9px;
        border: none;
        background: #5c6bc0;
        color: #fff;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        transition: background 0.15s;
    }
    .search-btn:hover { background: #3f51b5; }
    .search-btn:disabled { opacity: 0.55; cursor: default; }
    .search-btn svg { width: 15px; height: 15px; }

    /* Body */
    .body {
        flex: 1;
        overflow-y: auto;
        padding: 6px 14px 10px;
        min-height: 180px;
    }

    .state-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 52px 20px;
    }
    .state-text { font-size: 13px; color: #79747e; text-align: center; }
    .state-text.error { color: #c62828; }
    .state-text.muted { color: #a0a0a8; }

    .error-banner {
        font-size: 12px;
        color: #c62828;
        margin: 0 0 6px;
        padding: 0;
    }

    /* Grid */
    .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        padding: 2px 0 6px;
    }

    .card {
        border: none;
        background: #f5f5f5;
        border-radius: 9px;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        display: flex;
        flex-direction: column;
        text-align: left;
        transition: transform 0.15s, box-shadow 0.15s;
    }
    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.16);
    }
    .card:active { transform: translateY(0); }
    .card:disabled { opacity: 0.45; cursor: default; pointer-events: none; }

    .card-img-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 2/3;
        background: #e8e8e8;
        overflow: hidden;
    }
    .card-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .badge {
        position: absolute;
        bottom: 4px;
        left: 4px;
        font-size: 9px;
        font-weight: 600;
        padding: 2px 5px;
        border-radius: 4px;
        letter-spacing: 0.02em;
    }
    .badge-itunes { background: rgba(0,0,0,0.55); color: #fff; }
    .badge-google { background: rgba(66,133,244,0.75); color: #fff; }

    .card-title {
        padding: 5px 7px 6px;
        font-size: 10px;
        color: #49454f;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* Attribution */
    .attribution {
        font-size: 11px;
        color: #b8b8b8;
        text-align: center;
        padding: 5px 14px 11px;
        flex-shrink: 0;
        margin: 0;
    }

    /* Spinner */
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.35);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        flex-shrink: 0;
    }
    .spinner-dark {
        border-color: rgba(92,107,192,0.2);
        border-top-color: #5c6bc0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
