<script lang="ts">
    import { onMount, onDestroy, untrack } from "svelte";
    import { player, togglePlay, skipPrev, skipNext, savePlayerState, updateProgress } from "./player.svelte";
    import { formatTime } from "./books";
    import { convertFileSrc } from "@tauri-apps/api/core";

    let audioEl = $state<HTMLAudioElement | null>(null);
    let isScrubbing = false;
    let mockTimer: ReturnType<typeof setInterval> | undefined;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    // Позиция, захваченная ДО audioEl.load() — чтобы сброс currentTime=0
    // браузером не перезаписал player.progress до onLoadedMetadata
    let pendingSeek: number | null = null;

    let currentChapter = $derived(
        player.book ? player.book.chapters[player.currentIndex] : null
    );
    let hasRealAudio = $derived(!!currentChapter?.filePath);

    // ── Эффект 1: смена главы/книги → загрузить новый src
    $effect(() => {
        if (!audioEl || !currentChapter?.filePath) return;
        // untrack: читаем progress без подписки, иначе каждое обновление прогресса
        // перезапускало бы load() и сбрасывало воспроизведение в начало
        pendingSeek = untrack(() => player.progress);
        audioEl.src = convertFileSrc(currentChapter.filePath);
        audioEl.load();
        // seek + play происходит в onLoadedMetadata ниже
    });

    // ── Эффект 2: только isPlaying → play/pause когда файл уже загружен
    $effect(() => {
        if (!audioEl || !hasRealAudio) return;
        if (player.isPlaying) {
            audioEl.play().catch((e) => console.error("[player] play failed:", e));
        } else {
            audioEl.pause();
        }
    });

    // ── Эффект 3: громкость
    $effect(() => {
        if (audioEl) audioEl.volume = player.volume / 100;
    });

    // ── Mock timer для статических книг ─────────────────────────────────────
    $effect(() => {
        if (hasRealAudio) { clearInterval(mockTimer); return; }
        if (player.isPlaying && player.book && currentChapter) {
            mockTimer = setInterval(() => {
                updateProgress(player.progress + 1);
                if (player.progress >= currentChapter!.duration) skipNext();
            }, 1000);
        } else {
            clearInterval(mockTimer);
        }
        return () => clearInterval(mockTimer);
    });

    // ── Дебаунс сохранения позиции ───────────────────────────────────────────
    $effect(() => {
        player.progress; player.currentIndex; player.book; player.volume;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(savePlayerState, 500);
    });

    function onTimeUpdate() {
        if (!isScrubbing && audioEl) updateProgress(Math.floor(audioEl.currentTime));
    }

    function onLoadedMetadata() {
        if (!audioEl || !player.book) return;
        player.book.chapters[player.currentIndex].duration = Math.round(audioEl.duration);
        const seekTo = pendingSeek ?? player.progress;
        pendingSeek = null;
        audioEl.currentTime = seekTo;
        if (player.isPlaying) audioEl.play().catch((e) => console.error("[player] play failed:", e));
    }

    function onEnded() { skipNext(); }

    function onProgressInput() {
        isScrubbing = true;
        updateProgress(player.progress);
        if (audioEl && hasRealAudio) audioEl.currentTime = player.progress;
    }

    function onProgressChange() {
        isScrubbing = false;
    }

    function seekBy(delta: number) {
        if (!player.book) return;
        const chapter = player.book.chapters[player.currentIndex];
        const max = chapter.duration || 0;
        const newProg = Math.max(0, Math.min(max, player.progress + delta));
        updateProgress(newProg);
        if (audioEl && hasRealAudio) audioEl.currentTime = newProg;
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.code === "Space" && player.book) {
            e.preventDefault();
            togglePlay();
        }
    }

    onMount(() => {
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("beforeunload", savePlayerState);
    });
    onDestroy(() => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("beforeunload", savePlayerState);
        savePlayerState(); // сохранить при размонтировании компонента
    });
</script>

<!-- Audio всегда в DOM — иначе audioEl=null в момент срабатывания эффектов при старте -->
<audio
    bind:this={audioEl}
    ontimeupdate={onTimeUpdate}
    onloadedmetadata={onLoadedMetadata}
    onended={onEnded}
></audio>

{#if player.book && currentChapter}
    <div class="player">
        <!-- Now playing -->
        <div class="now-playing">
            <span class="np-chapter">Глава {currentChapter.id}</span>
            <span class="np-title">{currentChapter.title}</span>
        </div>

        <!-- Progress -->
        <div class="progress-row">
            <span class="time">{formatTime(player.progress)}</span>
            <div class="track-wrap">
                <input
                    class="slider"
                    type="range"
                    min="0"
                    max={currentChapter.duration || 100}
                    bind:value={player.progress}
                    oninput={onProgressInput}
                    onchange={onProgressChange}
                />
            </div>
            <span class="time right">
                {currentChapter.duration ? formatTime(currentChapter.duration) : "—:——"}
            </span>
        </div>

        <!-- Controls + Volume -->
        <div class="controls-row">
            <div class="transport">
                <button class="ctrl-btn" onclick={skipPrev} title="Предыдущая глава">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                    </svg>
                </button>
                <button class="ctrl-btn seek-btn" onclick={() => seekBy(-15)} title="-15 сек">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                        <text x="12" y="16.5" fill="currentColor" font-size="5.5" text-anchor="middle" font-weight="700" font-family="sans-serif">15</text>
                    </svg>
                </button>
                <button class="play-btn" onclick={togglePlay}>
                    {#if player.isPlaying}
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    {/if}
                </button>
                <button class="ctrl-btn seek-btn" onclick={() => seekBy(15)} title="+15 сек">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/>
                        <text x="12" y="16.5" fill="currentColor" font-size="5.5" text-anchor="middle" font-weight="700" font-family="sans-serif">15</text>
                    </svg>
                </button>
                <button class="ctrl-btn" onclick={skipNext} title="Следующая глава">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                </button>
            </div>

            <div class="volume-row">
                <svg
                    class="vol-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
                    />
                </svg>
                <div class="track-wrap volume-track">
                    <input
                        class="slider"
                        type="range"
                        min="0"
                        max="100"
                        bind:value={player.volume}
                    />
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .player {
        flex-shrink: 0;
        background: #fff;
        border-top: 1px solid #ececec;
        padding: 10px 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
    }

    /* ── Now playing ─── */
    .now-playing {
        display: flex;
        align-items: baseline;
        gap: 8px;
        overflow: hidden;
    }

    .np-chapter {
        font-size: var(--text-xs);
        font-weight: 600;
        color: #5c6bc0;
        flex-shrink: 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .np-title {
        font-size: var(--text-md);
        color: #1c1b1f;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ── Progress row ─── */
    .progress-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .time {
        font-size: var(--text-xs);
        color: #79747e;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
        width: 36px;
        line-height: 1;
    }

    .time.right {
        text-align: right;
    }

    /* ── Track wrapper ─── */
    .track-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        height: 28px;
    }

    .volume-track {
        flex: none;
        width: 88px;
    }

    /* ── Slider ─── */
    .slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 28px; /* увеличенная область нажатия */
        background: transparent;
        outline: none;
        cursor: pointer;
        padding: 0;
        margin: 0;
    }

    .slider::-webkit-slider-runnable-track {
        height: 6px;
        background: #e0e0e0;
        border-radius: 3px;
    }

    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #5c6bc0;
        margin-top: -5px;
        cursor: pointer;
        transition: transform 0.1s;
        box-shadow: 0 1px 4px rgba(92, 107, 192, 0.4);
    }

    .slider::-webkit-slider-thumb:hover {
        transform: scale(1.25);
    }

    /* ── Controls row ─── */
    .controls-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .transport {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .ctrl-btn {
        width: 44px;
        height: 44px;
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

    .ctrl-btn:hover {
        background: rgba(0, 0, 0, 0.07);
    }

    .ctrl-btn svg {
        width: 24px;
        height: 24px;
    }

    .seek-btn svg {
        width: 22px;
        height: 22px;
    }

    .play-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: #5c6bc0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #fff;
        padding: 0;
        transition: background 0.12s, transform 0.1s;
        box-shadow: 0 2px 8px rgba(92, 107, 192, 0.35);
    }

    .play-btn:hover {
        background: #3f51b5;
    }

    .play-btn:active {
        transform: scale(0.94);
    }

    .play-btn svg {
        width: 28px;
        height: 28px;
    }

    /* ── Volume ─── */
    .volume-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .vol-icon {
        width: 18px;
        height: 18px;
        color: #79747e;
        flex-shrink: 0;
    }
</style>
