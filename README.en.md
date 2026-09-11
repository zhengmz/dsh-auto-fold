# dsh-auto-fold

> Fills in the missing capability for DSH to auto-fold when the conversation display is set to Compact.
> 补齐 DSH 在对话显示设为 Compact（紧凑）时无法自动折叠的能力

[中文](README.md) · MIT

## What it does

When DeepSeek Harness Web opens an older conversation it only loads the latest 50 messages; older content requires clicking "Load earlier" page by page. **The official native per-turn folding only engages once the whole history is loaded (`hasMore === false`)** — each completed turn then collapses into one summary row (`N tool calls · Thought for a while`) with only the final answer visible. While history is incomplete the official client deliberately keeps everything expanded — that gate exists to guarantee the fold summary's counts and boundaries are authoritative.

This plugin automates the whole path:

```text
Open an older session        →  everything expanded (official gate: data not complete yet)
    ↓  auto session.loadThrough(0), pages 200 messages at a time to the very beginning
History complete (hasMore=false) →  official native per-turn folding takes over, one summary row per turn
```

- **Zero interaction**: runs automatically on session open, no button to press;
- **No extra fold rows**: renders no fold bars or summaries of its own — folding is entirely the official native one;
- **No takeover**: never touches `transcriptView`; the official "fold only when data is complete" guarantee stays intact;
- **Always authoritative**: fold summaries (counts, boundaries) are computed from complete history, never approximate;
- **Compact mode only**: backfill runs only when the official "Turn folding mode" is **Compact** (the default); when explicitly set to **Normal** it is skipped to avoid pointless loading.

## How it works

Pure browser-side plugin mounted on the official session-scoped slot `conversation.composer.dock` (renders nothing once loading finishes):

1. Reads the session snapshot (`useSession`) and `sessionId` from the slot's standard props;
2. Reads `transcriptView` from the official `ui-chat` settings namespace via `settingsScope`; continues only when it is `compact` (the default);
3. When `openState === 'open'` and `hasMore === true`, calls the official session method `session.loadThrough(0)`;
4. `loadThrough` pages backward (200 messages per page) until `hasMore === false`, with a built-in no-progress guard;
5. While paging, a single subtle "正在补齐历史…" hint line is shown (not a fold row) and disappears when done;
6. Once `hasMore === false`, the official native per-turn folding engages.

`loadThrough` is idempotent: repeated triggers (streaming appends / in-flight) are safe no-ops. Session switches are followed automatically.

## Install

```bash
dsh plugin --profile web add github:zhengmz/dsh-auto-fold
```

Or from a local checkout:

```bash
dsh plugin --profile web add /path/to/dsh-auto-fold
```

Restart DSH (`dsh web`) and refresh the browser afterwards.

## Uninstall

```bash
dsh plugin --profile web remove dsh-auto-fold
```

Fully reversible; no official files are modified.

## Optional settings (localStorage, browser console)

| Key | Value | Effect |
| --- | --- | --- |
| `dsh-auto-fold.disabled` | `'1'` | Disable auto-loading without uninstalling |

```js
localStorage.setItem('dsh-auto-fold.disabled', '1')   // disable
localStorage.removeItem('dsh-auto-fold.disabled')     // re-enable
```

## Compatibility

- Compatible with DeepSeek Harness `0.1.2-rc.1` - `0.1.5-rc.2` (Web profile)
- Pure client plugin: no host behavior, no telemetry, no network requests
- Relies on snapshot fields (`openState` / `hasMore` / `loadingOlder`), the `conversation.composer.dock` slot, and the `ui-chat.transcriptView` setting, verified against 0.1.2-rc.1 / 0.1.5-rc.2

## Known limitations

- Very long sessions take a moment to backfill on first open (200 messages per page; `hasMore` is per-session in-memory state, so switching back to a session re-triggers the backfill once);
- A running/unfinished turn stays expanded (official rule: folding applies only to closed turns); it folds automatically once it closes.

