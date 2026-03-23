import { useMemo, useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

import { deleteChatHistory, getChatIndex } from "../api/apiClient";
import SystemNotice from "./SystemNotice";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) {
    return `${mins}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days === 1) {
    return "Yesterday";
  }
  return `${days} days ago`;
}

function truncate(text, max = 60) {
  if (!text) {
    return "";
  }
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function ChatHistoryPage({ onSelectChat, onBack, onUploadNew }) {
  const [refreshTick, setRefreshTick] = useState(0);

  const chats = useMemo(() => {
    void refreshTick;
    return getChatIndex();
  }, [refreshTick]);

  const handleDelete = (event, paperId) => {
    event.stopPropagation();
    deleteChatHistory(paperId);
    setRefreshTick((prev) => prev + 1);
  };

  return (
    <main
      className="relative z-10 min-h-screen px-4 pb-10 pt-[80px]"
      style={{ color: "var(--text-primary)" }}
    >
      <section className="mx-auto w-full max-w-[680px]">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-[28px] font-bold">Previous Chats</h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Select a chat to continue
            </p>
          </div>
          <button
            type="button"
            onClick={onUploadNew}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            }}
          >
            <Plus size={16} />
            Upload New Paper
          </button>
        </div>

        {chats.length === 0 ? (
          <div
            className="rounded-2xl border bg-[color:var(--glass-bg)] p-10 text-center backdrop-blur-xl"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div
              className="mb-3 flex justify-center"
              style={{ color: "var(--accent)" }}
            >
              <MessageSquare size={48} />
            </div>
            <p className="text-lg font-semibold">No previous chats</p>
            <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
              Upload a paper to get started
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-6 rounded-xl px-5 py-3 text-sm font-medium text-white"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
              }}
            >
              Upload Paper
            </button>
          </div>
        ) : (
          <>
            {chats.map((item) => (
              <article
                key={item.paperId}
                role="button"
                tabIndex={0}
                onClick={() =>
                  onSelectChat({
                    paperId: item.paperId,
                    fileName: item.fileName,
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectChat({
                      paperId: item.paperId,
                      fileName: item.fileName,
                    });
                  }
                }}
                className="mb-3 cursor-pointer rounded-2xl border bg-[color:var(--glass-bg)] p-5 backdrop-blur-xl"
                style={{ borderColor: "var(--glass-border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span style={{ color: "var(--accent)" }}>
                      <MessageSquare size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[15px] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.fileName || item.paperId}
                      </p>
                      <p
                        className="font-mono text-[13px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.paperId}
                      </p>
                      <p
                        className="mt-1 truncate text-[15px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {truncate(item.lastQuestion, 60)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className="text-[13px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.messageCount} messages
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {timeAgo(item.savedAt)}
                    </p>
                    <button
                      type="button"
                      onClick={(event) => handleDelete(event, item.paperId)}
                      className="mt-2 inline-flex items-center justify-center bg-transparent"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <div className="mt-6">
              <SystemNotice
                type="info"
                message="Note: Chat history is saved locally. If you select a previous chat, you may need to re-upload the PDF if the server has restarted."
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default ChatHistoryPage;
