<script lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { onMount, onDestroy } from "svelte";
    import { settings, setFontSize, type FontSize } from "./settings.svelte";

    const appWindow = getCurrentWindow();

    let isMaximized = $state(false);
    let showSettings = $state(false);
    let unlisten: (() => void) | undefined;

    onMount(async () => {
        isMaximized = await appWindow.isMaximized();
        unlisten = await appWindow.onResized(async () => {
            isMaximized = await appWindow.isMaximized();
        });
    });

    onDestroy(() => unlisten?.());

    const fontSizeOptions: { value: FontSize; label: string }[] = [
        { value: "normal", label: "S" },
        { value: "large",  label: "M" },
        { value: "xlarge", label: "L" },
    ];

    function toggleSettings(e: MouseEvent) {
        e.stopPropagation();
        showSettings = !showSettings;
    }

    function pickSize(size: FontSize) {
        setFontSize(size);
        showSettings = false;
    }
</script>

<header class="titlebar" data-tauri-drag-region>
    <span class="app-title" data-tauri-drag-region>reads</span>

    <!-- Settings button + popover -->
    <div class="settings-wrap">
        <button class="icon-btn" onclick={toggleSettings} title="Настройки">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
        </button>

        {#if showSettings}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="settings-backdrop" onclick={() => showSettings = false}></div>
            <div class="settings-popover">
                <span class="settings-label">Размер шрифта</span>
                <div class="font-size-btns">
                    {#each fontSizeOptions as opt}
                        <button
                            class="fs-btn"
                            class:active={settings.fontSize === opt.value}
                            onclick={() => pickSize(opt.value)}
                        >{opt.label}</button>
                    {/each}
                </div>
            </div>
        {/if}
    </div>

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
        font-size: var(--text-base);
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

    /* ── Settings ─── */
    .settings-wrap {
        position: relative;
        margin-right: 4px;
    }

    .settings-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10;
    }

    .settings-popover {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 12px 14px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        z-index: 20;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 160px;
    }

    .settings-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #79747e;
        white-space: nowrap;
    }

    .font-size-btns {
        display: flex;
        gap: 6px;
    }

    .fs-btn {
        flex: 1;
        padding: 6px 0;
        border: 1.5px solid #e0e0e0;
        border-radius: 8px;
        background: transparent;
        font-size: 13px;
        font-weight: 600;
        color: #49454f;
        cursor: pointer;
        transition: background 0.12s, border-color 0.12s, color 0.12s;
    }

    .fs-btn:hover {
        background: rgba(92, 107, 192, 0.08);
        border-color: #5c6bc0;
        color: #5c6bc0;
    }

    .fs-btn.active {
        background: #5c6bc0;
        border-color: #5c6bc0;
        color: #fff;
    }
</style>
