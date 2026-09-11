# dsh-auto-fold

> Automatically load the full conversation history when a session opens, so the official native per-turn folding engages immediately.
> 打开会话自动加载全部历史，让官方原生回合折叠立即生效。

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
- **Always authoritative**: fold summaries (counts, boundaries) are computed from complete history, never approximate.

## How it works

Pure browser-side plugin mounted on the official session-scoped slot `conversation.composer.dock` (renders nothing once loading finishes):

1. Reads the session snapshot (`useSession`) and `sessionId` from the slot's standard props;
2. When `openState === 'open'` and `hasMore === true`, calls the official session method `session.loadThrough(0)`;
3. `loadThrough` pages backward (200 messages per page) until `hasMore === false`, with a built-in no-progress guard;
4. While paging, a single subtle "正在补齐历史…" hint line is shown (not a fold row) and disappears when done;
5. Once `hasMore === false`, the official native per-turn folding engages.

`loadThrough` is idempotent: repeated triggers (streaming appends / in-flight) are safe no-ops. Session switches are followed automatically.

## Install

```bash
dsh plugin --profile web add dsh-auto-fold
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

- DeepSeek Harness `>= 0.1.2-rc.1` (Web profile)
- Pure client plugin: no host behavior, no telemetry, no network requests
- Relies on snapshot fields (`openState` / `hasMore` / `loadingOlder`) and the `conversation.composer.dock` slot, verified against 0.1.2-rc.1

## Known limitations

- Very long sessions take a moment to backfill on first open (200 messages per page; `hasMore` is per-session in-memory state, so switching back to a session re-triggers the backfill once);
- A running/unfinished turn stays expanded (official rule: folding applies only to closed turns); it folds automatically once it closes.

