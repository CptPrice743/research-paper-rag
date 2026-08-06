# PaperPilot

A document QA system for research papers built with FastAPI, React, HuggingFace Inference API, FAISS, and GPT OSS 120B via Groq.

**Live Demo:** [research-paper-rag-ecru.vercel.app](https://research-paper-rag-ecru.vercel.app/)

---

## Overview

PaperPilot processes academic PDFs, extracts context-aware text chunks, indexes them using vector search, and generates grounded answers cited with source section IDs.

1. **PDF Parsing:** Extracts text block-by-block using PyMuPDF to preserve two-column paper layouts, then splits text into 800-token chunks with 150-token overlap.
2. **Embedding:** Generates 384-dimensional vectors using the HuggingFace Inference API (`all-MiniLM-L6-v2`), avoiding local PyTorch execution.
3. **Retrieval:** Stores vectors in an in-memory FAISS index (`IndexFlatIP`). Retrieves the top 5 matching chunks per question using cosine similarity.
4. **Generation:** Sends retrieved context to `llama-3.3-70b-versatile` on Groq, returning answers pinned to specific chunk IDs.

---

## Architecture

```
[Ingestion]
PDF File -> PyMuPDF Block Extractor -> Chunker (800 tok / 150 overlap) 
         -> HuggingFace API -> FAISS Index (In-Memory)

[Query]
Question -> HF Embedding API -> FAISS Cosine Search (Top-5) 
         -> Prompt Construction -> Groq API (Llama 3.3) -> Answer + Citations
```

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| Frontend | React, Vite, Tailwind CSS | Hosted on Vercel |
| Backend | FastAPI (Python 3.11) | Hosted on Render |
| PDF Extraction | PyMuPDF (`fitz`) | Block-level extraction for multi-column layouts |
| Embeddings | HuggingFace Inference API | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector Store | FAISS (`IndexFlatIP`) | In-memory inner product index |
| LLM Inference | Groq SDK | `llama-3.3-70b-versatile` |
| Rate Limiter | Redis / Dict fallback | 100 queries/day global, 10 queries/min per IP |

---

## Features

- **Multi-Column Layout Parsing:** Uses PyMuPDF block position sorting (vertical then horizontal) to prevent out-of-order text merging across two-column layouts.
- **Low Memory Footprint:** Offloads embedding computation to HuggingFace, keeping backend RAM usage under Render's 512 MB free tier limit.
- **Source Citation:** Every answer cites the source chunk IDs used to build the LLM context.
- **Strict Fallbacks:** Prompt constraints direct the model to return "Not found in the paper" when context is insufficient.
- **Quota & Throttling:** Global daily limits (100 queries/day) and rate limits (10 queries/min per IP) enforced via Redis with an in-memory fallback for local development.

---

## Project Structure

```
research-paper-rag/
├── backend/
│   ├── app.py                  # FastAPI entry point, middleware, CORS
│   ├── config.py               # Pydantic settings & env loader
│   ├── requirements.txt
│   ├── render.yaml             # Render service specification
│   ├── api/
│   │   ├── upload.py           # POST /upload — document ingestion endpoint
│   │   └── query.py            # POST /query — vector search & LLM generation
│   ├── services/
│   │   ├── pdf_parser.py       # PyMuPDF block parser
│   │   ├── chunker.py          # Token chunking with overlap
│   │   ├── embedding_service.py# HuggingFace API client
│   │   ├── llm_service.py      # Groq client & prompt builder
│   │   └── usage_limiter.py    # Redis / in-memory rate limiting
│   └── vectorstore/
│       └── faiss_store.py      # Per-paper FAISS index management
├── frontend/
│   ├── vite.config.js          # Vite config & dev server proxy
│   └── src/
│       ├── App.jsx             # Root layout & state handlers
│       ├── api/apiClient.js    # Axios client & error interceptors
│       └── components/         # Upload, Chat, and Notice components
└── README.md
```

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com)
- [HuggingFace Access Token](https://huggingface.co/settings/tokens)
- Redis instance (optional, falls back to in-memory)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
# Set GROQ_API_KEY and HF_TOKEN in .env

python app.py
```

Server runs on `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE=http://localhost:8000

npm run dev
```

App runs on `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq API access token |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Model name for inference |
| `HF_TOKEN` | Yes | — | HuggingFace API token |
| `MAX_DAILY_QUERIES` | No | `100` | Global daily request cap |
| `REDIS_URL` | No | — | Redis connection string |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE` | Yes | API endpoint URL (e.g. `http://localhost:8000`) |

---

## API Reference

### `POST /upload`
Uploads and indexes a research PDF.

- **Request:** `multipart/form-data` with `pdf` file field.
- **Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "paper_id": "paper_a1b2c3d4",
    "chunk_count": 18
  }
  ```

### `POST /query`
Queries an indexed paper.

- **Request:** `application/json`
  ```json
  {
    "paper_id": "paper_a1b2c3d4",
    "question": "What are the experimental results?"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "answer": "The proposed scheme achieves near-optimal task throughput...",
    "sources": [
      { "chunk_id": "paper_a1b2c3d4_c5", "section": "Section 5" }
    ],
    "meta": {
      "tokens_used": 3421,
      "retrieved_chunks": 5,
      "daily_query_count": 7
    }
  }
  ```

---

## Technical Considerations & Caveats

- **In-Memory Storage:** FAISS vector indices are stored in-memory per session. If the backend process restarts or the Render free container spins down, uploaded indices are lost and the PDF must be re-uploaded.
- **Embedding Cold Starts:** Initial calls to the HuggingFace Inference API after idle periods can take 3–5 seconds while the model warms up.
- **Section Parsing:** Section header extraction relies on font size heuristics in PyMuPDF; unformatted headings default to "Section Unknown".
