# PaperPilot 📄

> Upload any research PDF and ask natural language questions — powered by local embeddings, FAISS semantic retrieval, and Llama 3 via Groq.

**Live Demo:** 
**Backend API:** 

---

## What It Does

PaperPilot is a **RAG (Retrieval-Augmented Generation)** system for research papers. Instead of asking an LLM to memorize your document, it:

1. Breaks your PDF into overlapping chunks
2. Embeds each chunk locally using `sentence-transformers`
3. Stores vectors in an in-memory FAISS index
4. When you ask a question, finds the most semantically similar chunks
5. Sends only those chunks as context to the LLM
6. Returns a grounded answer with source citations

This means answers stay faithful to the paper, hallucinations are minimized, and you can see exactly which sections the answer came from.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INGEST FLOW                          │
│                                                             │
│  PDF Upload → PyMuPDF extraction → Chunker (800 tok, 150    │
│  overlap) → sentence-transformers embeddings → FAISS index  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        QUERY FLOW                           │
│                                                             │
│  Question → embed query → FAISS similarity search (top-5)   │
│  → build prompt → Groq (Llama 3) → answer + source chunks   │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────────────────────────┐
│   React +    │────▶│           FastAPI Backend            │
│   Tailwind   │◀────│  • PyMuPDF  • sentence-transformers  │
│   (Vercel)   │     │  • FAISS    • Groq SDK               │
└──────────────┘     │  • Redis rate limiter                │
                     └──────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | FastAPI (Python 3.11) |
| PDF Parsing | PyMuPDF (fitz) |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` (local, free) |
| Vector Store | FAISS (in-memory) |
| LLM Inference | Groq API — Llama 3.3 70B |
| Rate Limiting | Redis (production) / in-memory (dev fallback) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Features

- **PDF Upload** — drag and drop or file browser, PDF-only validation
- **Semantic Q&A** — FAISS cosine similarity retrieval, not keyword search
- **Source Citations** — every answer shows which chunks were used
- **Strict Prompting** — LLM instructed to say "Not found in the paper" rather than hallucinate
- **Two-Column PDF Support** — PyMuPDF block-level extraction handles academic paper layouts
- **Rate Limiting** — 100 queries/day global limit + 10 queries/minute per IP
- **Auto-Reset** — Redis TTL resets counters at UTC midnight automatically
- **Daily Counter UI** — header shows "Queries today: X / 100" live
- **Graceful Limit UI** — inline system notice card (not a toast) when limit is reached
- **Deployment Ready** — `render.yaml` + `vercel.json` included

---

## Project Structure

```
research-paper-rag/
│
├── backend/
│   ├── app.py                    # FastAPI app, CORS, routers, lifespan
│   ├── config.py                 # Pydantic settings (env vars)
│   ├── requirements.txt
│   ├── render.yaml               # Render deployment config
│   ├── Procfile
│   ├── .env.example
│   │
│   ├── api/
│   │   ├── upload.py             # POST /upload
│   │   └── query.py              # POST /query
│   │
│   ├── services/
│   │   ├── pdf_parser.py         # PyMuPDF extraction
│   │   ├── chunker.py            # Token-aware chunking with overlap
│   │   ├── embedding_service.py  # sentence-transformers (singleton)
│   │   ├── retrieval_service.py
│   │   ├── llm_service.py        # Groq SDK + prompt builder
│   │   └── usage_limiter.py      # Redis + in-memory rate limiter
│   │
│   └── vectorstore/
│       └── faiss_store.py        # FAISS IndexFlatIP, in-memory store
│
├── frontend/
│   ├── vercel.json               # SPA rewrite + cache headers
│   ├── vite.config.js            # Dev proxy + build config
│   ├── .env.example
│   │
│   └── src/
│       ├── App.jsx               # Upload → Chat screen switch
│       ├── api/
│       │   └── apiClient.js      # axios instance, error handling
│       └── components/
│           ├── UploadPaper.jsx   # Drag/drop, progress, success state
│           ├── ChatInterface.jsx # Message list, input, header counter
│           ├── ChatMessage.jsx   # User/AI bubbles, sources, meta
│           └── SystemNotice.jsx  # Inline system cards (limit, warning)
│
└── README.md
```

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Groq API key (free) — [console.groq.com](https://console.groq.com)
- Redis URL (free tier) — [redis.io/try-free](https://redis.io/try-free) *(optional — falls back to in-memory)*

---

### Backend Setup

```bash
# 1. Go to backend directory
cd backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
cp .env.example .env
# Fill in your values (see Environment Variables section below)

# 5. Start the backend
python app.py
# or: uvicorn app:app --reload
```

Backend runs at: `http://localhost:8000`  
API docs (Swagger): `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# 1. Go to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Set VITE_API_BASE=http://localhost:8000

# 4. Start the frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Your Groq API key from console.groq.com |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model to use for inference |
| `MAX_DAILY_QUERIES` | No | `100` | Global daily query limit |
| `REDIS_URL` | No | — | Redis connection URL. If empty, falls back to in-memory limiter |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins. Set to your Vercel URL in production |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE` | ✅ Yes | Backend URL. Use `http://localhost:8000` for local dev, your Render URL for production |

---

## API Reference

### `POST /upload`

Upload and index a PDF.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `pdf` | File | PDF file to upload |

**Response:**
```json
{
  "status": "ok",
  "paper_id": "paper_a1b2c3d4",
  "chunk_count": 18
}
```

**Errors:**
- `400` — File is not a PDF, or text extraction failed

---

### `POST /query`

Ask a question about an uploaded paper.

**Request:** `application/json`
```json
{
  "paper_id": "paper_a1b2c3d4",
  "question": "What are the experimental results?"
}
```

**Response:**
```json
{
  "answer": "The proposed scheme achieves near-optimal task throughput... (chunk_id: paper_a1b2c3d4_c5)",
  "sources": [
    { "chunk_id": "paper_a1b2c3d4_c5", "section": "Section 5" },
    { "chunk_id": "paper_a1b2c3d4_c6", "section": "Section Unknown" }
  ],
  "meta": {
    "tokens_used": 3421,
    "retrieved_chunks": 5,
    "daily_query_count": 7
  }
}
```

**Errors:**
- `404` — `paper_id` not found in FAISS store
- `429` — Daily query limit reached
- `502` — LLM service (Groq) unavailable

---

### `GET /health`

Health check.

```json
{ "status": "ok" }
```

---

## RAG Pipeline Details

### Chunking Strategy
- **Chunk size:** ~800 tokens (≈600 words)
- **Overlap:** ~150 tokens (≈112 words) — prevents context loss at chunk boundaries
- **Boundary preservation:** splits on paragraph breaks (`\n\n`) first, falls back to word-level
- **Metadata per chunk:** `chunk_id`, `paper_id`, `text`, `page_estimate`, `section_heading`

### Embeddings
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Dimension: 384
- Normalization: L2-normalized (enables cosine similarity via inner product)
- Loaded once at startup as a singleton — ~90MB, cached after first download

### Retrieval
- Index: `faiss.IndexFlatIP` (inner product on normalized vectors = cosine similarity)
- Top-k: 5 chunks per query (configurable)
- First chunk (`c0`) always included — ensures introduction/abstract available for general questions

### Prompt Template
```
You are a research assistant. Use ONLY the context provided to answer
the question. If the answer is not present in the context, respond
exactly with: "Not found in the paper." Always cite the chunk_ids you used.

[chunk_id: paper_xxx_c0 | section: Introduction]
<chunk text>

[chunk_id: paper_xxx_c5 | section: Section 5]
<chunk text>

Question:
<user question>
```

---

## Rate Limiting

Two modes — auto-detected based on `REDIS_URL`:

**Production (Redis):**
- Global daily limit: `MAX_DAILY_QUERIES` (default 100) per UTC day
- Per-IP limit: 10 requests/minute rolling window
- Atomic `INCR` operations — safe across multiple backend instances
- TTL set to next UTC midnight + 10s buffer on first write of the day
- Startup log: `PaperPilot rate limiter: REDIS mode active`

**Development (In-Memory):**
- Same daily limit logic, single-process only
- Resets automatically on UTC day change
- Startup log: `PaperPilot rate limiter: IN-MEMORY mode active`

---

## Deployment

### Deploy Backend to Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Render auto-detects `render.yaml` — verify settings:
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
6. Add environment variables in Render dashboard:
   - `GROQ_API_KEY` — your Groq key
   - `GROQ_MODEL` — `llama-3.3-70b-versatile`
   - `MAX_DAILY_QUERIES` — `100`
   - `REDIS_URL` — your Redis Cloud URL
   - `ALLOWED_ORIGINS` — your Vercel URL (add after deploying frontend)
7. Click **Deploy**

Test: `https://your-backend.onrender.com/health` → `{"status":"ok"}`

> **Note:** Free tier Render instances sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

---

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework preset: **Vite**
5. Add environment variable:
   - `VITE_API_BASE` — `https://your-backend.onrender.com`
6. Click **Deploy**

---

### Final Wiring

After both are deployed:
1. Copy your Vercel URL (e.g. `https://paperpilot-xyz.vercel.app`)
2. Go to Render → Environment → update `ALLOWED_ORIGINS` to your Vercel URL
3. Render will auto-redeploy

---

## Cost Breakdown

| Component | Cost |
|---|---|
| Embeddings (`sentence-transformers`, local) | **$0** |
| Vector store (FAISS, in-memory) | **$0** |
| LLM inference (Groq free tier) | **$0** for demo usage |
| Redis (free 30MB tier) | **$0** |
| Frontend hosting (Vercel free tier) | **$0** |
| Backend hosting (Render free tier) | **$0** |
| **Total** | **$0** |

The `MAX_DAILY_QUERIES=100` limit protects against unexpected Groq usage costs if you upgrade to a paid plan.

---

## Known Limitations

- **In-memory FAISS** — paper index is lost on backend restart (Render free tier restarts on sleep). Re-upload required after wake. Production upgrade: persist to object storage (S3/R2) or use Pinecone.
- **Single paper per session** — UI currently handles one paper at a time. Multi-paper support would require a paper selector UI.
- **Section detection** — section headings default to "Section Unknown" for some PDF layouts. Cosmetic only, does not affect retrieval quality.
- **Two-column PDFs** — handled well via PyMuPDF block extraction, but heavily formatted PDFs (tables, figures) may extract partial text.

