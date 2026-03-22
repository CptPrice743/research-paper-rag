function SystemNotice({ type = "info", message, subtext }) {
  const isLimit = type === "limit";

  const title = isLimit
    ? "Daily Limit Reached 🚦"
    : type === "warning"
      ? "Warning"
      : "Info";

  const body = isLimit
    ? "PaperPilot allows 100 AI queries per day. Resets at midnight UTC."
    : message;

  const styleMap = {
    info: "border-l-[3px] border-l-[#6366f1] text-slate-200",
    warning: "border-l-[3px] border-l-[#f59e0b] text-slate-200",
    limit: "border-l-[3px] border-l-[#ef4444] text-slate-200",
  };

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl ${styleMap[type] || styleMap.info}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
      {subtext ? (
        <p className="mt-2 text-xs text-slate-400">{subtext}</p>
      ) : null}
    </section>
  );
}

export default SystemNotice;
