import time

from fastapi import HTTPException
from groq import Groq

from config import settings

SYSTEM_PROMPT = """You are PaperPilot, a research paper 
assistant. Answer using ONLY the provided context chunks.

RULES:
- Answer directly if information exists in context
- Synthesize from related content if not explicitly stated
- For "limitations": find implied constraints or assumptions
- For "future work": if absent, synthesize from conclusion
- For "conclusion/summary": use outcome statements
- Only say "Not found in the paper." if truly absent
- Never hallucinate. Cite chunk_ids as [Sources: c1, c2]

EXAMPLES:
Q: "What are the limitations?"
A: "No explicit section. Implied limitations: (1) time 
estimation may be inaccurate under certain conditions 
(2) assumes general-purpose OS. [Sources: c9, c15]"

Q: "What is the future work?"  
A: "No explicit section. Based on conclusion, natural 
extensions include... [Sources: c25]"
"""

_client = Groq(api_key=settings.GROQ_API_KEY)


def build_prompt(chunks: list[dict], question: str) -> list[dict[str, str]]:
	context_blocks: list[str] = []
	for chunk in chunks:
		chunk_id = chunk.get("chunk_id", "unknown_chunk")
		section = chunk.get("section_heading", "Section Unknown")
		text = str(chunk.get("text", "")).strip()
		words = text.split()
		if len(words) > 200:
			text = " ".join(words[:200])
		context_blocks.append(f"[chunk_id: {chunk_id} | section: {section}]\n{text}")

	formatted_chunks = "\n\n".join(context_blocks)
	user_message = f"Context chunks:\n{formatted_chunks}\n\nQuestion: {question.strip()}"

	return [
		{"role": "system", "content": SYSTEM_PROMPT},
		{"role": "user", "content": user_message},
	]


def generate_answer(messages: list[dict[str, str]]) -> dict:
	max_retries = 3
	retry_delay = 65

	for attempt in range(max_retries):
		try:
			response = _client.chat.completions.create(
				model=settings.GROQ_MODEL,
				messages=messages,
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
			error_str = str(exc)
			print(f"Groq API error (attempt {attempt + 1}): {exc}")

			if "rate_limit_exceeded" in error_str and attempt < max_retries - 1:
				print(f"Rate limited. Waiting {retry_delay}s before retry...")
				time.sleep(retry_delay)
				continue

			raise HTTPException(
				status_code=502,
				detail="LLM service unavailable",
			) from exc


def extract_sources(chunks: list[dict]) -> list[dict]:
	return [
		{
			"chunk_id": chunk.get("chunk_id"),
			"section": chunk.get("section_heading", "Section Unknown"),
		}
		for chunk in chunks
	]
