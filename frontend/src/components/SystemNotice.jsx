import { AlertTriangle, Info, MessageSquare } from "lucide-react";

function SystemNotice({ type = "info", message, subtext }) {
  const isLimit = type === "limit";
  const isHistory =
    typeof message === "string" && message.startsWith("Chat history restored");

  const title = isLimit
    ? "Daily Limit Reached"
    : type === "warning"
      ? "Warning"
      : "Info";

  const body = isLimit
    ? "PaperPilot allows 100 AI queries per day. Resets at midnight UTC."
    : message;

  const styleMap = {
    info: "border-l-[3px] text-[color:var(--text-primary)]",
    warning: "border-l-[3px] text-[color:var(--text-primary)]",
    limit: "border-l-[3px] text-[color:var(--text-primary)]",
  };

  const leftBorderColor = isLimit
    ? "#ef4444"
    : type === "warning"
      ? "#f59e0b"
      : "var(--accent)";

  const icon =
    isLimit || type === "warning" ? (
      <AlertTriangle size={16} />
    ) : isHistory ? (
      <MessageSquare size={16} />
    ) : (
      <Info size={16} />
    );

  return (
    <section
      className={`rounded-2xl border bg-[color:var(--glass-bg)] p-4 backdrop-blur-xl ${styleMap[type] || styleMap.info}`}
      style={{
        borderColor: "var(--glass-border)",
        borderLeftColor: leftBorderColor,
      }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </p>
      <p
        className="mt-1 text-sm leading-6"
        style={{ color: "var(--text-secondary)" }}
      >
        {body}
      </p>
      {subtext ? (
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {subtext}
        </p>
      ) : null}
    </section>
  );
}

export default SystemNotice;
