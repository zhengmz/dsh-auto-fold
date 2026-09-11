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
		// 字段取自已验证的 DSH 0.1.2-rc.1 SessionSnapshot：openState / hasMore / loadingOlder。
		function isEligible(snapshot) {
			return snapshot !== null && typeof snapshot === "object" &&
				snapshot.openState === "open" &&
				snapshot.hasMore === true &&
				snapshot.loadingOlder !== true;
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
			inject: ["sessions", "slots"],
			apply(ctx) {
				const sessions = ctx.get("sessions");
				const slots = ctx.get("slots");
				if (sessions === void 0 || slots === void 0) return;
				slots.inject("conversation.composer.dock", () => {
					const dispose = slots.register({
						name: "conversation.composer.dock",
						id: "dsh-auto-fold",
						order: 90
					}, (props) => {
						const snapshot = props.useSession((s) => s);
						const sessionId = props.sessionId;
						// 自动补齐：会话打开且 hasMore 时调用官方 loadThrough(0)，
						// 内部按 200 条/页翻到底、带防死循环保护；loadThrough 幂等，
						// 重复触发（流式/加载中）是安全 no-op。
						React.useEffect(() => {
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
						}, [sessionId, snapshot]);
						// 补齐历史期间的轻量提示（非折叠行；加载完成自动消失）。
						if (snapshot !== null && typeof snapshot === "object" &&
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
