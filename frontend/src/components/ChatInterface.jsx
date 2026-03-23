import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Send, Upload } from "lucide-react";

import {
  checkPaperExists,
  queryPaper,
  saveChatIndex,
  uploadPaper,
} from "../api/apiClient";
import ChatMessage from "./ChatMessage";
import SystemNotice from "./SystemNotice";

function ChatInterface({ paperId, fileName, onPaperReupload }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paperExpired, setPaperExpired] = useState(false);
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploadError, setReuploadError] = useState("");
  const [isReuploading, setIsReuploading] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const canSend = useMemo(
    () => inputValue.trim().length > 0 && !isLoading && !paperExpired,
    [inputValue, isLoading, paperExpired],
  );

  const isRestoreNotice = (message) =>
    message?.type === "notice" &&
    String(message?.content || message?.message || "")
      .toLowerCase()
      .includes("restored");

  useEffect(() => {
    if (!paperId) {
      setMessages([]);
      setPaperExpired(false);
      setReuploadError("");
      setReuploadFile(null);
      return;
    }

    const saved = localStorage.getItem(`chat_${paperId}`);
    if (!saved) {
      setMessages([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setMessages([]);
        return;
      }

      const hasNotice = parsed.some(isRestoreNotice);
      if (hasNotice) {
        setMessages(parsed);
      } else {
        setMessages([
          ...parsed,
          {
            id: crypto.randomUUID(),
            role: "system",
            type: "notice",
            noticeType: "info",
            content:
              "Chat history restored. Note: if the server restarted, you may need to re-upload the PDF to ask new questions.",
          },
        ]);
      }
    } catch {
      setMessages([]);
    }
  }, [paperId]);

  useEffect(() => {
    if (!paperId || messages.length === 0) {
      return;
    }
    const toSave = messages.filter((m) => !isRestoreNotice(m));
    localStorage.setItem(`chat_${paperId}`, JSON.stringify(toSave));
    saveChatIndex(paperId, toSave, fileName);
  }, [messages, paperId, fileName]);

  useEffect(() => {
    if (!paperId) {
      return;
    }

    let cancelled = false;
    checkPaperExists(paperId).then((exists) => {
      if (!cancelled) {
        setPaperExpired(!exists);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [paperId]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const resizeTextarea = () => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 72)}px`;
  };

  useEffect(() => {
    resizeTextarea();
  }, [inputValue]);

  const appendMessage = (message) => {
    setMessages((prev) => {
      const updatedMessages = [
        ...prev,
        { id: crypto.randomUUID(), ...message },
      ];
      if (paperId) {
        saveChatIndex(paperId, updatedMessages, fileName);
      }
      return updatedMessages;
    });
  };

  const handleReupload = async (file) => {
    if (!file) {
      return;
    }

    setReuploadFile(file);

    if (fileName && file.name !== fileName) {
      setReuploadError(
        `Expected "${fileName}" but got "${file.name}". Please upload the same paper to continue this chat.`,
      );
      return;
    }

    setReuploadError("");
    setIsReuploading(true);

    try {
      const result = await uploadPaper(file);
      setPaperExpired(false);
      setMessages((prev) => {
        const updatedMessages = [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            type: "notice",
            noticeType: "info",
            content: `Paper re-uploaded successfully. ${result.chunk_count} chunks re-indexed. You can now continue asking questions.`,
          },
        ];

        localStorage.setItem(
          `chat_${result.paper_id}`,
          JSON.stringify(updatedMessages),
        );
        saveChatIndex(result.paper_id, updatedMessages, fileName || file.name);
        return updatedMessages;
      });

      if (result.paper_id !== paperId && onPaperReupload) {
        onPaperReupload(result.paper_id, fileName || file.name);
      }
    } catch {
      setReuploadError("Re-upload failed. Please try again.");
    } finally {
      setIsReuploading(false);
    }
  };

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || isLoading) {
      return;
    }

    appendMessage({ type: "chat", role: "user", content: question });
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await queryPaper(paperId, question);
      appendMessage({
        type: "chat",
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        meta: result.meta,
      });
    } catch (error) {
      if (error.message === "DAILY_LIMIT_REACHED") {
        appendMessage({ type: "notice", noticeType: "limit" });
      } else {
        appendMessage({
          type: "notice",
          noticeType: "warning",
          message: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="flex h-screen flex-col pt-[60px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto w-full max-w-[800px]">
          {messages.length === 0 ? (
            <SystemNotice
              type="info"
              message="Ask a question about your uploaded paper to get grounded answers with citations."
            />
          ) : null}

          {messages.map((message) => {
            if (message.type === "notice") {
              return (
                <div key={message.id} className="mb-4">
                  <SystemNotice
                    type={message.noticeType}
                    message={message.message || message.content}
                    subtext={message.subtext}
                  />
                </div>
              );
            }

            return (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                sources={message.sources}
                meta={message.meta}
              />
            );
          })}

          {isLoading ? (
            <div className="mb-4 flex justify-start">
              <div
                className="rounded-2xl border bg-[color:var(--glass-bg)] px-4 py-4 text-[15px] backdrop-blur-xl"
                style={{
                  borderColor: "var(--glass-border)",
                  color: "var(--text-secondary)",
                }}
              >
                Thinking…
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {paperExpired ? (
        <div className="shrink-0 px-6 pb-3">
          <div
            className="mx-auto w-full max-w-[800px]"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#ef4444",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              <AlertTriangle size={16} />
              <span>Paper session expired</span>
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              The server has restarted and your paper is no longer indexed.
              Re-upload {fileName || "this paper"} to continue asking questions.
            </p>

            <input
              type="file"
              accept=".pdf"
              id="reupload-input"
              style={{ display: "none" }}
              onChange={(event) => handleReupload(event.target.files?.[0])}
            />

            <button
              type="button"
              onClick={() => document.getElementById("reupload-input")?.click()}
              disabled={isReuploading}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
              }}
            >
              <Upload size={14} />
              {isReuploading ? "Re-uploading..." : "Re-upload PDF"}
            </button>

            {reuploadFile ? (
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Selected: {reuploadFile.name}
              </p>
            ) : null}

            {reuploadError ? (
              <p className="mt-2 text-sm" style={{ color: "#ef4444" }}>
                {reuploadError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className="shrink-0 border-t bg-[color:var(--glass-bg)] backdrop-blur-xl"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="mx-auto flex w-full max-w-[800px] items-end gap-3 px-6 py-4">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={paperExpired}
            placeholder={
              paperExpired
                ? "Re-upload the PDF above to continue..."
                : "Ask about methods, results, limitations, or citations..."
            }
            className="max-h-[72px] min-h-[44px] flex-1 resize-none rounded-xl border bg-[color:var(--glass-bg)] px-4 py-3 text-[15px] leading-6 outline-none placeholder:text-[var(--text-muted)]"
            style={{
              borderColor: "var(--glass-border)",
              color: "var(--text-primary)",
              caretColor: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            }}
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

export default ChatInterface;
