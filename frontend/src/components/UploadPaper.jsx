import { useRef, useState } from "react";

import { uploadPaper } from "../api/apiClient";

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 p-10 text-center transition ${
          isDragOver
            ? "border-solid border-blue-600 bg-blue-50"
            : "border-dashed border-slate-300 bg-slate-50 hover:border-blue-500"
        }`}
      >
        <p className="text-sm font-medium text-slate-700">
          Drop your PDF here or click to browse
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Supports research papers in PDF format
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => handleFilePick(event.target.files?.[0])}
        />
      </div>

      {file ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-700">{file.name}</p>
          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {isUploading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <span>Indexing paper…</span>
        </div>
      ) : null}

      {paperId ? (
        <p className="mt-4 text-sm font-medium text-emerald-600">
          ✓ Ready! {chunkCount} chunks indexed
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="mt-5 h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Upload Paper
      </button>
    </section>
  );
}

export default UploadPaper;
