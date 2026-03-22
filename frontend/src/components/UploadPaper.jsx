import { useRef, useState } from "react";

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
        onUploadSuccess(result.paper_id);
      }, 1500);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 pt-[60px]">
      <div className="w-full max-w-[480px] rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
        <h1 className="mb-2 text-[22px] font-bold text-slate-100">Upload Research Paper</h1>
        <p className="mb-8 text-sm text-slate-400">
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
              ? "border-[#6366f1] bg-[rgba(99,102,241,0.1)]"
              : "border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.05)]"
          }`}
        >
          <p className="text-5xl">📄</p>
          <p className="mt-3 text-base font-medium text-slate-100">Drop your PDF here</p>
          <p className="mt-1 text-sm text-slate-400">or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 bg-transparent text-sm text-indigo-400 underline"
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
          <div className="mt-4 inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 backdrop-blur-xl">
            📄 {file.name} · {formatFileSize(file.size)}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

        {isUploading ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-indigo-400" />
            <span>Indexing paper…</span>
          </div>
        ) : null}

        {paperId ? (
          <div className="mt-5 flex flex-col items-center justify-center text-indigo-400">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-bold">
              ✓
            </span>
            <p className="mt-2 text-sm font-semibold">Ready! {chunkCount} chunks indexed</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUploading ? "Indexing paper…" : "Upload Paper"}
        </button>
      </div>
    </section>
  );
}

export default UploadPaper;
