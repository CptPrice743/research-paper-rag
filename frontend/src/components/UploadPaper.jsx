import { useRef, useState } from "react";
import { CheckCircle, FileText, Upload } from "lucide-react";

import { uploadPaper } from "../api/apiClient";

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

function UploadPaper({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [paperId, setPaperId] = useState(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const inputRef = useRef(null);

  const handleFilePick = (nextFile) => {
    if (!nextFile) {
      return;
    }

    if (nextFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      setFile(null);
      return;
    }

    setError("");
    setPaperId(null);
    setChunkCount(0);
    setFileName(nextFile.name);
    setFile(nextFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFilePick(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const result = await uploadPaper(file);
      setPaperId(result.paper_id);
      setChunkCount(result.chunk_count);

      setTimeout(() => {
        onUploadSuccess(result.paper_id, fileName || file.name);
      }, 1500);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 pt-[60px]">
      <div
        className="w-full max-w-[480px] rounded-2xl border bg-[color:var(--glass-bg)] p-10 text-center backdrop-blur-xl"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <h1
          className="mb-2 text-[22px] font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Upload Research Paper
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
          PDF files only · Max semantic analysis in seconds
        </p>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-10 text-center ${
            isDragOver
              ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
              : "bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
          }`}
          style={{
            borderColor: isDragOver
              ? "var(--accent)"
              : "color-mix(in srgb, var(--accent) 40%, transparent)",
          }}
        >
          <div
            className="flex justify-center"
            style={{ color: "var(--accent)" }}
          >
            <Upload size={48} />
          </div>
          <p
            className="mt-3 text-base font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Drop your PDF here
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            or
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 bg-transparent text-sm underline"
            style={{ color: "var(--accent)" }}
          >
            Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => handleFilePick(event.target.files?.[0])}
          />
        </div>

        {file ? (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border bg-[color:var(--glass-bg)] px-4 py-2 text-sm backdrop-blur-xl"
            style={{
              color: "var(--text-primary)",
              borderColor: "var(--glass-border)",
            }}
          >
            <FileText size={16} /> {file.name} · {formatFileSize(file.size)}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

        {isUploading ? (
          <div
            className="mt-4 flex items-center justify-center gap-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30"
              style={{ borderTopColor: "var(--accent)" }}
            />
            <span>Indexing paper…</span>
          </div>
        ) : null}

        {paperId ? (
          <div
            className="mt-5 flex flex-col items-center justify-center"
            style={{ color: "var(--accent)" }}
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 20%, transparent)",
              }}
            >
              <CheckCircle size={24} />
            </span>
            <p className="mt-2 text-sm font-semibold">
              Ready! {chunkCount} chunks indexed
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
          }}
        >
          {isUploading ? "Indexing paper…" : "Upload Paper"}
        </button>
      </div>
    </section>
  );
}

export default UploadPaper;
