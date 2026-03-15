from fastapi import HTTPException
from groq import Groq

from config import settings

SYSTEM_PROMPT = (
	"You are a research assistant. Use ONLY the context provided to answer "
	"the question. If the answer is not present in the context, respond exactly "
	"with: 'Not found in the paper.' Always cite the chunk_ids you used."
)

_client = Groq(api_key=settings.GROQ_API_KEY)


def build_prompt(chunks: list[dict], question: str) -> str:
	context_blocks: list[str] = []
	for chunk in chunks:
		chunk_id = chunk.get("chunk_id", "unknown_chunk")
		section = chunk.get("section_heading", "Section Unknown")
		text = str(chunk.get("text", "")).strip()
		words = text.split()
		if len(words) > 500:
			text = " ".join(words[:500])
		context_blocks.append(f"[chunk_id: {chunk_id} | section: {section}]\n{text}")

	context_text = "\n\n".join(context_blocks)
	return (
		f"{SYSTEM_PROMPT}\n\n"
		f"Context:\n{context_text}\n\n"
		f"Question:\n{question.strip()}"
	)


def generate_answer(prompt: str) -> dict:
	try:
		response = _client.chat.completions.create(
			model=settings.GROQ_MODEL,
			messages=[
				{
					"role": "user",
					"content": prompt,
				}
			],
			max_tokens=1024,
		)

		answer = ""
		if response.choices:
			answer = response.choices[0].message.content or ""

		tokens_used = 0
		if response.usage and response.usage.total_tokens is not None:
			tokens_used = int(response.usage.total_tokens)

		return {"answer": answer, "tokens_used": tokens_used}
	except Exception as exc:
		raise HTTPException(status_code=502, detail="LLM service unavailable") from exc


def extract_sources(chunks: list[dict]) -> list[dict]:
	return [
		{
			"chunk_id": chunk.get("chunk_id"),
			"section": chunk.get("section_heading", "Section Unknown"),
		}
		for chunk in chunks
	]
