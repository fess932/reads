<script lang="ts">
    import { onMount } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { settings, setSerperApiKey } from "./settings.svelte";

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
        title: string;
        thumbnail: string;
        full: string;
    }

    const initialQuery = [bookTitle, bookAuthor].filter(Boolean).join(" ");
    let query = $state(initialQuery);
    let results = $state<CoverResult[]>([]);
    let loading = $state(false);
    let selecting = $state<string | null>(null);
    let error = $state("");

    // Key management (reuse bingApiKey field for serper key)
    let showKeyInput = $state(!settings.serperApiKey);
    let keyDraft = $state(settings.serperApiKey);

    function saveKey() {
        setSerperApiKey(keyDraft);
        showKeyInput = false;
        if (settings.serperApiKey) search();
    }

    // ── Serper.dev Image Search ───────────────────────────────────────────────
    async function search() {
        const q = query.trim();
        if (!q) return;
        if (!settings.serperApiKey) {
            showKeyInput = true;
            return;
        }

        loading = true;
        error = "";
        results = [];

        try {
            const res = await fetch("https://google.serper.dev/images", {
                method: "POST",
                headers: {
                    "X-API-KEY": settings.serperApiKey,

                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ q, num: 20 }),
            });

            if (res.status === 401 || res.status === 403) {
                throw new Error("Неверный API ключ");
            }
            if (!res.ok) {
                throw new Error(`Ошибка сервера: ${res.status}`);
            }

            const data = await res.json();
            results = ((data.images ?? []) as Record<string, string>[])
                .filter((it) => it.imageUrl && it.thumbnailUrl)
                .slice(0, 18)
                .map((it) => ({
                    title: it.title ?? "",
                    thumbnail: it.thumbnailUrl,
                    full: it.imageUrl,
                }));

            if (results.length === 0) error = "Ничего не найдено. Попробуйте другой запрос.";
        } catch (e) {
            error = e instanceof Error ? e.message : String(e);
        } finally {
            loading = false;
        }
    }

    // ── Скачать через Rust (обходит CORS) ─────────────────────────────────────
    async function pickCover(r: CoverResult) {
        selecting = r.full;
        error = "";
        try {
            const dataUrl = await invoke<string>("download_image", { url: r.full });
            onSelect(dataUrl);
        } catch {
            // Если основной URL не скачался — попробуем thumbnail
            try {
                const dataUrl = await invoke<string>("download_image", { url: r.thumbnail });
                onSelect(dataUrl);
            } catch (e) {
                error = `Не удалось загрузить: ${e}`;
                selecting = null;
            }
        }
    }

    function onBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    onMount(() => {
        if (settings.serperApiKey) search();
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
            <span class="modal-title">Выбор обложки</span>
            <div class="header-right">
                <button
                    class="icon-btn"
                    class:key-active={!!settings.serperApiKey}
                    onclick={() => { keyDraft = settings.serperApiKey; showKeyInput = !showKeyInput; }}
                    title="API ключ Serper"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                    </svg>
                </button>
                <button class="icon-btn" onclick={onClose} aria-label="Закрыть">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Key panel -->
        {#if showKeyInput}
            <div class="key-panel">
                <p class="key-hint">
                    <strong>serper.dev</strong> — Google Images через API.<br>
                    2 500 бесплатных запросов после регистрации.
                    <a href="https://serper.dev" target="_blank" rel="noopener">Получить ключ →</a>
                </p>
                <div class="key-row">
                    <input
                        class="key-input"
                        type="password"
                        bind:value={keyDraft}
                        placeholder="Вставьте API Key…"
                        onkeydown={(e) => e.key === "Enter" && saveKey()}
                    />
                    <button class="key-save" onclick={saveKey} disabled={!keyDraft.trim()}>
                        Сохранить
                    </button>
                </div>
            </div>
        {/if}

        <!-- Search -->
        <div class="search-row">
            <input
                class="search-input"
                type="text"
                bind:value={query}
                placeholder="Название книги, автор…"
                onkeydown={(e) => e.key === "Enter" && search()}
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
                    <span class="state-text">Загружаю…</span>
                </div>
            {:else if loading}
                <div class="state-center">
                    <span class="spinner spinner-dark"></span>
                    <span class="state-text">Поиск…</span>
                </div>
            {:else if !settings.serperApiKey}
                <div class="state-center">
                    <span class="state-text state-muted">Введите API ключ serper.dev чтобы начать поиск</span>
                </div>
            {:else if error && results.length === 0}
                <div class="state-center">
                    <span class="state-text state-error">{error}</span>
                </div>
            {:else if results.length === 0}
                <div class="state-center">
                    <span class="state-text state-muted">Введите название и нажмите «Найти»</span>
                </div>
            {:else}
                {#if error}
                    <p class="error-banner">{error}</p>
                {/if}
                <div class="grid">
                    {#each results as r (r.full)}
                        <button
                            class="card"
                            onclick={() => pickCover(r)}
                            title={r.title}
                            disabled={!!selecting}
                        >
                            <div class="img-wrap">
                                <img src={r.thumbnail} alt={r.title} loading="lazy" />
                            </div>
                            <span class="card-title">{r.title}</span>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <p class="attribution">Google Images via serper.dev</p>
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
        padding: 14px 14px 12px 16px;
        border-bottom: 1px solid #ececec;
        flex-shrink: 0;
    }
    .modal-title {
        font-size: 15px;
        font-weight: 600;
        color: #1c1b1f;
    }
    .header-right {
        display: flex;
        align-items: center;
        gap: 2px;
    }
    .icon-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #79747e;
        padding: 0;
        transition: background 0.12s, color 0.12s;
    }
    .icon-btn:hover { background: rgba(0,0,0,0.07); color: #5c6bc0; }
    .icon-btn svg { width: 18px; height: 18px; }
    .icon-btn.key-active { color: #43a047; }

    /* Key panel */
    .key-panel {
        background: #f3f8ff;
        border-bottom: 1px solid #dce8f8;
        padding: 10px 14px 12px;
        flex-shrink: 0;
    }
    .key-hint {
        font-size: 12px;
        color: #49454f;
        margin: 0 0 8px;
        line-height: 1.5;
    }
    .key-hint a { color: #5c6bc0; text-decoration: none; }
    .key-hint a:hover { text-decoration: underline; }
    .key-row { display: flex; gap: 7px; }
    .key-input {
        flex: 1;
        height: 34px;
        border: 1.5px solid #c8d8f0;
        border-radius: 8px;
        padding: 0 10px;
        font-size: 12px;
        font-family: monospace;
        color: #1c1b1f;
        outline: none;
        background: #fff;
        transition: border-color 0.15s;
    }
    .key-input:focus { border-color: #5c6bc0; }
    .key-save {
        height: 34px;
        padding: 0 13px;
        border-radius: 8px;
        border: none;
        background: #5c6bc0;
        color: #fff;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s;
    }
    .key-save:hover { background: #3f51b5; }
    .key-save:disabled { opacity: 0.5; cursor: default; }

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
        padding: 4px 14px 10px;
        min-height: 180px;
    }
    .state-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 48px 20px;
    }
    .state-text { font-size: 13px; color: #79747e; text-align: center; }
    .state-error { color: #c62828; }
    .state-muted { color: #a0a0a8; }
    .error-banner { font-size: 12px; color: #c62828; margin: 0 0 6px; }

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
    .card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.16); }
    .card:active { transform: translateY(0); }
    .card:disabled { opacity: 0.45; cursor: default; pointer-events: none; }

    .img-wrap {
        width: 100%;
        aspect-ratio: 2/3;
        background: #e4e4e4;
        overflow: hidden;
    }
    .img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
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
        color: #c0c0c0;
        text-align: center;
        padding: 4px 14px 10px;
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
