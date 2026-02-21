<script lang="ts">
    import { onMount } from "svelte";
    import TitleBar from "$lib/TitleBar.svelte";
    import PlayerBar from "$lib/PlayerBar.svelte";
    import { initLibrary } from "$lib/libraryStore.svelte";
    import { settings, initSettings, fontSizeVars } from "$lib/settings.svelte";

    let { children } = $props();

    onMount(async () => {
        await initSettings();
        await initLibrary();
    });
</script>

<div class="app-shell" style={fontSizeVars(settings.fontSize)}>
    <TitleBar />
    <div class="page-content">
        {@render children()}
    </div>
    <PlayerBar />
</div>

<style>
    :global(*, *::before, *::after) {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    :global(html, body) {
        height: 100%;
        overflow: hidden;
        background: #ffffff;
        color: #1a1a1a;
    }

    .app-shell {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
    }

    .page-content {
        flex: 1;
        overflow: auto;
        min-height: 0;
    }
</style>
