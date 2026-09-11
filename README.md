# dsh-auto-fold

> 打开会话自动加载全部历史，让官方原生回合折叠立即生效。
> Automatically load the full conversation history when a session opens, so the official native per-turn folding engages immediately.

[English](README.en.md) · MIT

## 这是什么

DeepSeek Harness Web 打开一个旧会话时，只加载最近 50 条消息；更早的内容要手动一页页点「加载更早」。**只有全部历史加载完（`hasMore=false`），官方原生的"回合折叠"才会生效**——每轮收成一条 `N 次工具调用 · 已思考`，只保留最终回答。历史没加载完时，官方会刻意保持全展开（这是官方为保证折叠摘要数据完整而设的安全门槛）。

本插件让「打开会话 → 自动补齐全部历史 → 官方回合折叠生效」全程自动化：

```text
打开旧会话          →  全展开（官方门槛生效，数据未完整不折叠）
    ↓  自动 loadThrough(0)，按 200 条/页翻到底
历史补全（hasMore=false） →  官方原生回合折叠立即接管，每轮收成一条摘要
```

- **零按钮**：打开会话即自动执行，无需点击；
- **不新增折叠行**：不渲染任何自己的折叠栏/摘要，折叠完全由官方原生完成；
- **不接管官方设置**：不改 `transcriptView`，官方"数据完整才折叠"的保证原样保留；
- **数据完整无偏差**：折叠摘要里的次数/边界都基于完整历史，绝无偏差；
- **仅 Compact 模式生效**：官方「回合折叠方式」为 **Compact**（默认值）时才自动补齐历史；显式设为 **Normal** 时跳过，避免无谓加载。

## 工作原理

纯浏览器端插件，挂在官方会话级槽位 `conversation.composer.dock`（列表槽，加载完成后不渲染任何可见内容）：

1. 通过槽位标准 props 拿到会话快照（`useSession`）与 `sessionId`；
2. 通过官方 `settingsScope` 读取 `ui-chat` 命名空间的 `transcriptView`：仅当为 `compact`（默认）时继续；
3. 快照 `openState === 'open'` 且 `hasMore === true` 时，调用官方会话方法 `session.loadThrough(0)`；
4. `loadThrough` 内部按 200 条/页向后翻页直到 `hasMore === false`，自带防死循环保护（无进展即停）；
5. 补齐期间显示一行轻量提示「正在补齐历史…」（非折叠行），完成后自动消失；
6. `hasMore === false` 后官方原生回合折叠自动生效。

`loadThrough` 是幂等的：重复触发（流式追加/加载中）是安全 no-op，不会重复翻页。切换会话自动跟随。

## 安装

```bash
dsh plugin --profile web add github:zhengmz/dsh-auto-fold
```

或从本地源码安装：

```bash
dsh plugin --profile web add /path/to/dsh-auto-fold
```

安装后重启 DSH（`dsh web`）并刷新浏览器页面。

## 卸载

```bash
dsh plugin --profile web remove dsh-auto-fold
```

卸载即完全还原，不修改任何官方文件。

## 可选设置（localStorage，浏览器控制台执行）

| 键 Key | 值 Value | 效果 Effect |
| --- | --- | --- |
| `dsh-auto-fold.disabled` | `'1'` | 整体停用自动补齐（逃生开关）/ disable the plugin without uninstalling |

```js
localStorage.setItem('dsh-auto-fold.disabled', '1')   // 停用
localStorage.removeItem('dsh-auto-fold.disabled')     // 恢复
```

## 兼容性

- 兼容 DeepSeek Harness `0.1.2-rc.1` - `0.1.5-rc.2`（Web profile）
- 纯浏览器端插件：无宿主行为、无数据上报、无网络请求
- 依赖的会话快照字段（`openState` / `hasMore` / `loadingOlder`）、槽位 `conversation.composer.dock` 与 `ui-chat.transcriptView` 设置在 0.1.2-rc.1 / 0.1.5-rc.2 已验证

## 已知限制

- 超长会话首次打开补齐会有一点加载耗时（每页 200 条，`hasMore` 为会话内存态，每次切回该会话会重新触发一次补齐）；
- 正在运行/未结束的回合保持展开（官方规则：回合未结束不折叠），回合结束后自动收起。

