function ChatMessage({ role, content, sources = [], meta }) {
  const isUser = role === "user";

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={
          isUser
            ? "max-w-[80%] rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white"
            : "max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
        }
      >
        <p className="whitespace-pre-wrap leading-6">{content}</p>

        {!isUser && Array.isArray(sources) && sources.length > 0 ? (
          <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
            <summary className="cursor-pointer text-xs font-medium text-slate-600">
              Sources
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {sources.map((source, index) => (
                <li key={`${source.chunk_id || "source"}-${index}`}>
                  <span>
                    📄 {source.chunk_id || "Unknown chunk"} —{" "}
                    {source.section || "Section Unknown"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {!isUser && meta ? (
          <p className="mt-3 text-xs text-slate-500">
            Tokens: {meta.tokens_used ?? 0} | Chunks retrieved:{" "}
            {meta.retrieved_chunks ?? 0}
          </p>
        ) : null}
      </article>
    </div>
  );
}

export default ChatMessage;
