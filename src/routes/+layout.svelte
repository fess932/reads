<script lang="ts">
    import TitleBar from "$lib/TitleBar.svelte";
    import PlayerBar from "$lib/PlayerBar.svelte";

    let { children } = $props();
</script>

<div class="app-shell">
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
