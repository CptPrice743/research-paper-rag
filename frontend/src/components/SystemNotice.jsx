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
    info: "border-l-4 border-l-blue-600 border-blue-100 bg-blue-50 text-blue-900",
    warning:
      "border-l-4 border-l-amber-500 border-amber-200 bg-amber-50 text-amber-900",
    limit:
      "border-l-4 border-l-amber-500 border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <section
      className={`rounded-xl border p-4 shadow-sm ${styleMap[type] || styleMap.info}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6">{body}</p>
      {subtext ? <p className="mt-2 text-xs opacity-80">{subtext}</p> : null}
    </section>
  );
}

export default SystemNotice;
