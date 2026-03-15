from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.chunker import chunk_text
from services.embedding_service import embed_texts
from services.pdf_parser import extract_text
from vectorstore.faiss_store import save_paper

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/")
async def upload_paper(pdf: UploadFile = File(...)):
	if pdf.content_type != "application/pdf":
		raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

	paper_id = f"paper_{uuid4().hex[:8]}"

	text = await extract_text(pdf)
	chunks = chunk_text(text, paper_id)
	embeddings = embed_texts([chunk["text"] for chunk in chunks])
	save_paper(paper_id, chunks, embeddings)

	return {
		"status": "ok",
		"paper_id": paper_id,
		"chunk_count": len(chunks),
	}
