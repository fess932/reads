<script lang="ts">
    import { goto } from "$app/navigation";
    import { books } from "$lib/books";
</script>

<div class="library">
    <p class="subtitle">Аудиокниги</p>

    <div class="grid">
        {#each books as book}
            <button class="card" onclick={() => goto(`/book/${book.id}`)}>
                <div class="cover" style="background: {book.cover}">
                    <span class="year">{book.year}</span>
                </div>
                <div class="info">
                    <span class="title">{book.title}</span>
                    <span class="author">{book.author}</span>
                </div>
            </button>
        {/each}
    </div>
</div>

<style>
    .library {
        padding: 24px;
        height: 100%;
        overflow-y: auto;
    }

    .subtitle {
        font-family: system-ui, sans-serif;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #79747e;
        margin-bottom: 20px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
        gap: 16px;
    }

    .card {
        background: #fff;
        border: none;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        text-align: left;
        padding: 0;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(0, 0, 0, 0.06);
        transition:
            box-shadow 0.2s,
            transform 0.2s;
    }

    .card:hover {
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.12),
            0 2px 6px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
    }

    .card:active {
        transform: translateY(0);
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .cover {
        aspect-ratio: 2 / 3;
        position: relative;
        display: flex;
        align-items: flex-end;
        padding: 8px;
        border-radius: 12px 12px 0 0;
    }

    .year {
        font-family: system-ui, sans-serif;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
    }

    .info {
        padding: 10px 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .title {
        font-family: system-ui, sans-serif;
        font-size: 13px;
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
        font-family: system-ui, sans-serif;
        font-size: 11px;
        color: #79747e;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
