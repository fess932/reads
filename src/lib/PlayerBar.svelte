<script lang="ts">
  import { player, togglePlay, skipPrev, skipNext } from "./player.svelte";
  import { formatTime } from "./books";

  let intervalId: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    if (player.isPlaying && player.book) {
      intervalId = setInterval(() => {
        player.progress++;
        const chapter = player.book!.chapters[player.currentIndex];
        if (player.progress >= chapter.duration) {
          if (player.currentIndex < player.book!.chapters.length - 1) {
            player.currentIndex++;
            player.progress = 0;
          } else {
            player.isPlaying = false;
            player.progress = 0;
          }
        }
      }, 1000);
    } else {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  });

  let currentChapter = $derived(
    player.book ? player.book.chapters[player.currentIndex] : null
  );
</script>

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
          max={currentChapter.duration}
          bind:value={player.progress}
        />
      </div>
      <span class="time right">{formatTime(currentChapter.duration)}</span>
    </div>

    <!-- Controls + Volume -->
    <div class="controls-row">
      <div class="transport">
        <button class="ctrl-btn" onclick={skipPrev} title="Назад">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
          </svg>
        </button>
        <button class="play-btn" onclick={togglePlay}>
          {#if player.isPlaying}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
          {/if}
        </button>
        <button class="ctrl-btn" onclick={skipNext} title="Вперёд">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </div>

      <div class="volume-row">
        <svg class="vol-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
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
    font-size: 11px;
    font-weight: 600;
    color: #5c6bc0;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .np-title {
    font-size: 13px;
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
    font-size: 11px;
    color: #79747e;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    width: 32px;
    line-height: 1;
  }

  .time.right { text-align: right; }

  /* ── Track wrapper — gives the slider room for its thumb ─── */
  .track-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    height: 20px; /* height that accommodates the thumb */
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
    background: transparent;
    outline: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }

  /* Track */
  .slider::-webkit-slider-runnable-track {
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
  }

  /* Thumb — margin-top centers it on the 4px track */
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #5c6bc0;
    margin-top: -5px; /* (4px track − 14px thumb) / 2 */
    cursor: pointer;
    transition: transform 0.1s;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
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
    transition: background 0.12s;
  }

  .ctrl-btn:hover { background: rgba(0, 0, 0, 0.07); }
  .ctrl-btn svg { width: 20px; height: 20px; }

  .play-btn {
    width: 44px;
    height: 44px;
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

  .play-btn:hover { background: #3f51b5; }
  .play-btn:active { transform: scale(0.94); }
  .play-btn svg { width: 22px; height: 22px; }

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
