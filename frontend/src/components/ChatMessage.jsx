import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

function ChatMessage({ role, content, sources = [], meta }) {
  const isUser = role === "user";
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={
          isUser
            ? "max-w-[70%] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] text-white"
            : "max-w-[85%] rounded-2xl rounded-bl-sm border bg-[color:var(--glass-bg)] px-4 py-4 text-[15px] leading-7 backdrop-blur-xl"
        }
        style={
          isUser
            ? { background: "var(--user-bubble-bg)" }
            : {
                borderColor: "var(--glass-border)",
                color: "var(--text-primary)",
              }
        }
      >
        <p className="whitespace-pre-wrap">{content}</p>

        {!isUser && Array.isArray(sources) && sources.length > 0 ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowSources((prev) => !prev)}
              className="flex items-center gap-1 border-none bg-transparent text-[13px]"
              style={{ color: "var(--accent)" }}
            >
              {showSources ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}{" "}
              Sources ({sources.length})
            </button>
            {showSources ? (
              <ul className="mt-2 space-y-1">
                {sources.map((source, index) => (
                  <li
                    key={`${source.chunk_id || "source"}-${index}`}
                    className="flex items-center gap-2 rounded-lg border bg-[color:var(--glass-bg)] px-3 py-2 font-mono text-xs"
                    style={{
                      borderColor: "var(--glass-border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <FileText size={14} />
                    {source.chunk_id || "Unknown chunk"} -{" "}
                    {source.section || "Section Unknown"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {!isUser && meta ? (
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            ~{meta.tokens_used ?? 0} tokens · {meta.retrieved_chunks ?? 0}{" "}
            chunks
          </p>
        ) : null}
      </article>
    </div>
  );
}

export default ChatMessage;
