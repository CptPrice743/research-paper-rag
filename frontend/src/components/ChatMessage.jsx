import { useState } from "react";

function ChatMessage({ role, content, sources = [], meta }) {
  const isUser = role === "user";
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={
          isUser
            ? "max-w-[70%] rounded-2xl rounded-br-sm bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-3 text-[15px] text-white"
            : "max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-4 py-4 text-[15px] leading-7 text-slate-100 backdrop-blur-xl"
        }
      >
        <p className="whitespace-pre-wrap">{content}</p>

        {!isUser && Array.isArray(sources) && sources.length > 0 ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowSources((prev) => !prev)}
              className="border-none bg-transparent text-[13px] text-[#6366f1]"
            >
              {showSources ? "▼" : "▶"} Sources ({sources.length})
            </button>
            {showSources ? (
              <ul className="mt-2 space-y-1">
                {sources.map((source, index) => (
                  <li
                    key={`${source.chunk_id || "source"}-${index}`}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-400"
                  >
                    📄 {source.chunk_id || "Unknown chunk"} -{" "}
                    {source.section || "Section Unknown"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {!isUser && meta ? (
          <p className="mt-2 text-xs text-slate-600">
            Tokens: {meta.tokens_used ?? 0} | Chunks retrieved:{" "}
            {meta.retrieved_chunks ?? 0}
          </p>
        ) : null}
      </article>
    </div>
  );
}

export default ChatMessage;
