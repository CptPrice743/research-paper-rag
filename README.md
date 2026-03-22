# PaperPilot 📄

> Upload any research PDF and ask natural language questions — powered by HuggingFace API embeddings, FAISS semantic retrieval, and Llama 3 via Groq.

**Live Demo:** https://research-paper-i3yzw9u3y-vyom-uchats-projects.vercel.app

**Backend API:** https://research-paper-rag.onrender.com

---

## What It Does

PaperPilot is a **RAG (Retrieval-Augmented Generation)** system for research papers. Instead of asking an LLM to memorize your document, it:

1. Breaks your PDF into overlapping chunks
2. Embeds each chunk via HuggingFace Inference API (`all-MiniLM-L6-v2`)
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
│  PDF Upload → PyMuPDF extraction → Chunker (800 tok, 150   │
│  overlap) → HuggingFace API embeddings → FAISS index        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        QUERY FLOW                           │
│                                                             │
│  Question → embed query → FAISS similarity search (top-5)  │
│  → build prompt → Groq (Llama 3) → answer + source chunks  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────────────────────────┐
│   React +    │────▶│           FastAPI Backend            │
│   Tailwind   │◀────│  • PyMuPDF  • HuggingFace API        │
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
| PDF Parsing | PyMuPDF (fitz) — handles two-column academic layouts |
| Embeddings | HuggingFace Inference API — `all-MiniLM-L6-v2` (384 dims) |
| Vector Store | FAISS `IndexFlatIP` (in-memory, cosine similarity) |
| LLM Inference | Groq API — `llama-3.3-70b-versatile` |
| Rate Limiting | Redis (production) / in-memory dict (dev fallback) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Features

- **PDF Upload** — drag and drop or file browser, PDF-only validation
- **Two-Column PDF Support** — PyMuPDF block-level extraction handles academic paper layouts correctly
- **Semantic Q&A** — FAISS cosine similarity retrieval, not keyword search
- **Source Citations** — every answer shows which chunk IDs were used
- **Strict Prompting** — LLM instructed to say "Not found in the paper" rather than hallucinate
- **Rate Limiting** — 100 queries/day global limit + 10 queries/minute per IP
- **Auto-Reset** — Redis TTL resets counters at UTC midnight automatically
- **Daily Counter UI** — header shows "Queries today: X / 100" live
- **Graceful Limit UI** — inline system notice card when limit is reached
- **Zero PyTorch dependency** — embeddings via API keeps RAM under Render's 512MB free tier limit
- **Deployment Ready** — `render.yaml` + `vercel.json` + `Procfile` included

---

## Project Structure

```
research-paper-rag/
│
├── backend/
│   ├── app.py                    # FastAPI app, CORS, routers, lifespan, PORT handling
│   ├── config.py                 # Pydantic settings (all env vars)
│   ├── requirements.txt
│   ├── render.yaml               # Render deployment config
│   ├── Procfile                  # Fallback process config
│   ├── .env.example
│   │
│   ├── api/
│   │   ├── upload.py             # POST /upload — ingest pipeline
│   │   └── query.py              # POST /query — RAG pipeline + rate limiting
│   │
│   ├── services/
│   │   ├── pdf_parser.py         # PyMuPDF block extraction (two-column aware)
│   │   ├── chunker.py            # Token-aware chunking with overlap
│   │   ├── embedding_service.py  # HuggingFace Inference API (no local model)
│   │   ├── llm_service.py        # Groq SDK, prompt builder, source extractor
│   │   └── usage_limiter.py      # Redis (prod) + in-memory (dev) rate limiter
│   │
│   └── vectorstore/
│       └── faiss_store.py        # FAISS IndexFlatIP, in-memory per paper_id
│
├── frontend/
│   ├── vercel.json               # SPA rewrite + static asset cache headers
│   ├── vite.config.js            # Dev proxy → localhost:8000, build output: dist
│   ├── .env.example
│   │
│   └── src/
│       ├── App.jsx               # Upload → Chat screen switch on paperId state
│       ├── api/
│       │   └── apiClient.js      # axios instance, DAILY_LIMIT_REACHED error handling
│       └── components/
│           ├── UploadPaper.jsx   # Drag/drop, spinner, success state, 1.5s delay
│           ├── ChatInterface.jsx # Message list, auto-scroll, header counter
│           ├── ChatMessage.jsx   # User/AI bubbles, collapsible sources, meta line
│           └── SystemNotice.jsx  # Inline system cards (info, warning, limit)
│
└── README.md
```

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- Groq API key (free) — [console.groq.com](https://console.groq.com)
- HuggingFace token (free) — [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- Redis URL (free, optional) — [redis.io/try-free](https://redis.io/try-free) *(falls back to in-memory if not set)*

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
| `GROQ_API_KEY` | ✅ Yes | — | Groq API key from console.groq.com |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model for LLM inference |
| `HF_TOKEN` | ✅ Yes | — | HuggingFace token for embedding API calls |
| `MAX_DAILY_QUERIES` | No | `100` | Global daily query limit |
| `REDIS_URL` | No | — | Redis connection URL. Falls back to in-memory if empty |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated CORS origins. Set to Vercel URL in production |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE` | ✅ Yes | Backend URL. `http://localhost:8000` locally, Render URL in production |

---

## API Reference

### `POST /upload`

Upload and index a PDF.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `pdf` | File | PDF file (must be `application/pdf`) |

**Response:**
```json
{
  "status": "ok",
  "paper_id": "paper_a1b2c3d4",
  "chunk_count": 18
}
```

**Errors:**
- `400` — File is not a PDF or text extraction failed

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
    { "chunk_id": "paper_a1b2c3d4_c0", "section": "Introduction" }
  ],
  "meta": {
    "tokens_used": 3421,
    "retrieved_chunks": 5,
    "daily_query_count": 7
  }
}
```

**Errors:**
- `404` — `paper_id` not found (FAISS resets on backend restart)
- `429` — Daily query limit reached. Resets at midnight UTC
- `500` — `HF_TOKEN` not configured
- `502` — Groq LLM service unavailable

---

### `GET /health`

Health check endpoint.

```json
{ "status": "ok" }
```

---

## RAG Pipeline Details

### PDF Extraction
- Uses **PyMuPDF** (`fitz`) block-level extraction
- Blocks sorted by vertical then horizontal position — correctly handles two-column academic PDF layouts
- `pdfplumber` was evaluated and rejected due to word-merging issues on multi-column layouts

### Chunking Strategy
- **Chunk size:** ~800 tokens (≈600 words)
- **Overlap:** ~150 tokens (≈112 words) — prevents context loss at chunk boundaries
- **Boundary preservation:** splits on paragraph breaks (`\n\n`) first, falls back to word-level
- **Metadata per chunk:** `chunk_id`, `paper_id`, `text`, `page_estimate`, `section_heading`
- First chunk (`c0`) always included in retrieval — ensures introduction/abstract is always available

### Embeddings
- Model: `sentence-transformers/all-MiniLM-L6-v2` via HuggingFace Inference API
- Endpoint: `https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction`
- Dimension: 384
- Output: L2-normalized float32 numpy arrays
- No local model loading — keeps backend RAM well under Render's 512MB free tier limit

### Retrieval
- Index: `faiss.IndexFlatIP` (inner product on L2-normalized vectors = cosine similarity)
- Top-k: 5 chunks per query
- In-memory store keyed by `paper_id` — resets on process restart

### Prompt Template
```
You are a research assistant. Use ONLY the context provided to answer
the question. If the answer is not present in the context, respond
exactly with: "Not found in the paper." Always cite the chunk_ids you used.

[chunk_id: paper_xxx_c0 | section: Introduction]
<chunk text — truncated to 500 words>

[chunk_id: paper_xxx_c5 | section: Section 5]
<chunk text — truncated to 500 words>

Question:
<user question>
```

---

## Rate Limiting

Two modes — auto-detected at startup based on whether `REDIS_URL` is set:

**Production (Redis-backed):**
- Global daily limit: `MAX_DAILY_QUERIES` per UTC day
- Per-IP limit: 10 requests/minute rolling window (60s TTL key)
- Atomic `INCR` — safe across multiple backend instances
- TTL set to next UTC midnight + 10s buffer on first write of the day
- Connection timeout: 3 seconds — falls back to in-memory if Redis unreachable
- Startup log: `PaperPilot rate limiter: REDIS mode active`

**Development (in-memory fallback):**
- Same daily limit logic using a Python dict
- Single-process only — resets on restart
- Auto-resets on UTC day change
- Startup log: `PaperPilot rate limiter: IN-MEMORY mode active`

---

## Deployment

### Deploy Backend to Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Verify settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
6. Add all environment variables in Render dashboard:

| Key | Value |
|---|---|
| `GROQ_API_KEY` | your Groq key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `HF_TOKEN` | your HuggingFace token |
| `MAX_DAILY_QUERIES` | `100` |
| `REDIS_URL` | your Redis Cloud URL |
| `ALLOWED_ORIGINS` | your Vercel URL (set after frontend deploy) |

7. Click **Deploy**

Test: `https://your-backend.onrender.com/health` → `{"status":"ok"}`

> **Note:** Free tier Render instances sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up. FAISS index resets on sleep — users need to re-upload their PDF after a cold start.

---

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework preset: **Vite**
5. Add environment variable:
   - `VITE_API_BASE` → `https://your-backend.onrender.com`
6. Click **Deploy**

---

### Final Wiring

After both are deployed:
1. Copy your Vercel URL (no trailing slash)
2. Go to Render → Environment → update `ALLOWED_ORIGINS` to your Vercel URL
3. Render auto-redeploys with updated CORS config

---

## Cost Breakdown

| Component | Technology | Cost |
|---|---|---|
| Embeddings | HuggingFace Inference API free tier | **$0** |
| Vector store | FAISS in-memory | **$0** |
| LLM inference | Groq free tier | **$0** |
| Rate limiting | Redis Cloud free 30MB tier | **$0** |
| Frontend hosting | Vercel free tier | **$0** |
| Backend hosting | Render free tier | **$0** |
| **Total** | | **$0** |

`MAX_DAILY_QUERIES=100` protects against unexpected costs if you upgrade to a paid Groq plan.

---

## Known Limitations

- **In-memory FAISS** — index resets on backend restart or Render sleep. Users must re-upload their PDF after a cold start. Production fix: persist index to object storage (S3/R2) or use Pinecone.
- **Single paper per session** — one paper at a time. Multi-paper support would require a paper selector UI and persistent storage.
- **Section detection** — headings show as "Section Unknown" for some PDF layouts. Cosmetic only, does not affect retrieval quality.
- **HuggingFace cold start** — first embedding call after model inactivity may take 3–5 seconds.
- **Complex queries** — questions about "future work", "limitations", or "methodology" sometimes return "Not found" because relevant content is spread across many chunks. Increasing top-k or adding query expansion would improve coverage.