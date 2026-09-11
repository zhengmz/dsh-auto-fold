window.__ModuleLoader__.load({
	id: "dsh-auto-fold",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var react = require("react");
		var React = react.default || react;

		// localStorage 逃生开关：置 "1" 时整体停用自动补齐（无需卸载插件）。
		var DISABLED_KEY = "dsh-auto-fold.disabled";

		// 会话快照处于"还有更早历史未加载、可以自动补齐"的状态。
		function isEligible(snapshot) {
			return snapshot !== null && typeof snapshot === "object" &&
				snapshot.openState === "open" &&
				snapshot.hasMore === true &&
				snapshot.loadingOlder !== true;
		}

		// 官方 ui-chat 命名空间的 transcriptView（"回合折叠方式"设置）：
		// 仅当为 "compact"（默认值）时官方原生回合折叠才会生效，此时才需要自动补齐历史；
		// 用户显式设为 "normal" 时跳过，避免无谓加载。
		function isCompactMode(scope) {
			try {
				const section = scope.getSnapshot().value;
				const mode = section === void 0 || section === null ? void 0 : section.transcriptView;
				return mode !== "normal";
			} catch (e) {
				return true; // 读不到设置时按官方默认 compact 处理
			}
		}

		var STYLE = {
			container: {
				display: "flex",
				justifyContent: "center",
				padding: "2px 0"
			},
			hint: {
				color: "var(--dsw-alias-label-tertiary, #8b8f99)",
				fontSize: "12px",
				lineHeight: "18px"
			}
		};

		module.exports = {
			name: "dsh-auto-fold",
			inject: ["sessions", "slots", "settingsScope"],
			apply(ctx) {
				const sessions = ctx.get("sessions");
				const slots = ctx.get("slots");
				const settingsScope = ctx.get("settingsScope");
				if (sessions === void 0 || slots === void 0 || settingsScope === void 0) return;
				const transcriptScope = settingsScope.bind({ namespace: "ui-chat" });
				slots.inject("conversation.composer.dock", () => {
					const dispose = slots.register({
						name: "conversation.composer.dock",
						id: "dsh-auto-fold",
						order: 90
					}, (props) => {
						const snapshot = props.useSession((s) => s);
						const sessionId = props.sessionId;
						const isCompact = React.useSyncExternalStore(
							(cb) => transcriptScope.subscribe(cb),
							() => isCompactMode(transcriptScope)
						);
						// 自动补齐：仅当官方回合折叠模式为 Compact 且 hasMore 时，
						// 调用官方 loadThrough(0)（内部 200 条/页翻到底、防死循环、幂等）。
						React.useEffect(() => {
							if (!isCompact) return;
							if (!isEligible(snapshot)) return;
							try {
								if (typeof window !== "undefined" && window.localStorage &&
									window.localStorage.getItem(DISABLED_KEY) === "1") return;
							} catch (e) { /* ignore */ }
							const binding = sessions.binding(sessionId);
							if (binding === void 0) return;
							try {
								const r = binding.session.loadThrough(0);
								if (r !== null && r !== void 0 && typeof r.catch === "function") {
									r.catch((err) => {
										console.warn("[dsh-auto-fold] loadThrough failed:", err);
									});
								}
							} catch (err) {
								console.warn("[dsh-auto-fold] loadThrough threw:", err);
							}
						}, [sessionId, snapshot, isCompact]);
						// 补齐历史期间的轻量提示（非折叠行；加载完成自动消失）。
						if (isCompact && snapshot !== null && typeof snapshot === "object" &&
							snapshot.openState === "open" &&
							snapshot.hasMore === true &&
							snapshot.loadingOlder === true) {
							return React.createElement(
								"div",
								{ style: STYLE.container },
								React.createElement("span", { style: STYLE.hint }, "正在补齐历史…")
							);
						}
						return null;
					});
					return () => {
						dispose();
					};
				});
			}
		};
		return module.exports;
	}
});
