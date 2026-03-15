from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Request

from services.embedding_service import embed_query
from services.llm_service import build_prompt, extract_sources, generate_answer
from services.usage_limiter import check_and_increment, get_daily_count
from vectorstore.faiss_store import search

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
	paper_id: str
	question: str


def _get_client_ip(request: Request) -> str:
	x_forwarded_for = request.headers.get("x-forwarded-for")
	if x_forwarded_for:
		return x_forwarded_for.split(",")[0].strip()

	if request.client and request.client.host:
		return request.client.host

	return "unknown"


@router.post("/")
def query_papers(payload: QueryRequest, request: Request):
	ip = _get_client_ip(request)
	allowed, _ = check_and_increment(ip)
	if not allowed:
		raise HTTPException(
			status_code=429,
			detail="Daily query limit reached. Resets at midnight UTC.",
		)

	q_embedding = embed_query(payload.question)
	chunks = search(payload.paper_id, q_embedding, top_k=5)
	prompt = build_prompt(chunks, payload.question)
	result = generate_answer(prompt)
	sources = extract_sources(chunks)

	return {
		"answer": result["answer"],
		"sources": sources,
		"meta": {
			"tokens_used": result["tokens_used"],
			"retrieved_chunks": len(chunks),
			"daily_query_count": get_daily_count(),
		},
	}
