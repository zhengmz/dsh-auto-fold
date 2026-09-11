// dsh-auto-fold host half: intentionally empty.
// All behavior lives in the browser half (lib/client.js): when a session
// opens with unloaded history (hasMore=true), it automatically calls
// session.loadThrough(0) to page through everything. Once the window is
// complete (hasMore=false), the OFFICIAL native per-turn folding engages —
// no extra fold rows, no transcriptView takeover, data stays authoritative.
function apply() {}
export { apply as default };
