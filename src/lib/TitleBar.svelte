<script lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { onMount, onDestroy } from "svelte";

    const appWindow = getCurrentWindow();

    let isMaximized = $state(false);
    let unlisten: (() => void) | undefined;

    onMount(async () => {
        isMaximized = await appWindow.isMaximized();
        unlisten = await appWindow.onResized(async () => {
            isMaximized = await appWindow.isMaximized();
        });
    });

    onDestroy(() => unlisten?.());
</script>

<header class="titlebar" data-tauri-drag-region>
    <span class="app-title" data-tauri-drag-region>reads</span>

    <div class="window-actions">
        <button
            class="icon-btn"
            onclick={() => appWindow.minimize()}
            title="Свернуть"
        >
            <svg viewBox="0 0 20 20" aria-hidden="true">
                <line
                    x1="3"
                    y1="10"
                    x2="17"
                    y2="10"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                />
            </svg>
        </button>

        <button
            class="icon-btn"
            onclick={() => appWindow.toggleMaximize()}
            title={isMaximized ? "Восстановить" : "Развернуть"}
        >
            {#if isMaximized}
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect
                        x="6"
                        y="3"
                        width="11"
                        height="11"
                        rx="1"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                    <path
                        d="M3 7 L3 17 L13 17"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        fill="none"
                    />
                </svg>
            {:else}
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect
                        x="3"
                        y="3"
                        width="14"
                        height="14"
                        rx="1"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                </svg>
            {/if}
        </button>

        <button
            class="icon-btn icon-btn-close"
            onclick={() => appWindow.close()}
            title="Закрыть"
        >
            <svg viewBox="0 0 20 20" aria-hidden="true">
                <line
                    x1="4"
                    y1="4"
                    x2="16"
                    y2="16"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                />
                <line
                    x1="16"
                    y1="4"
                    x2="4"
                    y2="16"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                />
            </svg>
        </button>
    </div>
</header>

<style>
    .titlebar {
        display: flex;
        align-items: center;
        height: 48px;
        background: #fff;
        padding: 0 1px 0 16px;
        flex-shrink: 0;
        user-select: none;
        -webkit-user-select: none;
        position: relative;
        z-index: 1;
        border-bottom: 0.5px solid #ccc;
    }

    .app-title {
        flex: 1;
        font-family: "Roboto", "Google Sans", system-ui, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #1c1b1f;
        letter-spacing: 0.01em;
        pointer-events: none;
    }

    /* ── Icon buttons ─── */

    .window-actions {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .icon-btn {
        width: 40px;
        height: 48px;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: default;
        color: #49454f;
        padding: 0;
        transition: background 0.15s;
    }

    .icon-btn svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
    }

    .icon-btn:hover {
        background: rgba(0, 0, 0, 0.08);
    }

    .icon-btn:active {
        background: rgba(0, 0, 0, 0.14);
    }

    .icon-btn-close:hover {
        background: rgba(176, 0, 32, 0.1);
        color: #b00020;
    }

    .icon-btn-close:active {
        background: rgba(176, 0, 32, 0.16);
    }
</style>
