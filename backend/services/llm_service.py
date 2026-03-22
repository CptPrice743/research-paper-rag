from fastapi import HTTPException
from groq import Groq

from config import settings

SYSTEM_PROMPT = """You are PaperPilot, a research paper assistant.
Answer questions using ONLY the provided context chunks.

REASONING STEPS:
1. Read all chunks carefully
2. Find explicit OR implied answers
3. Cite every chunk_id used as [Sources: chunk_id_1, chunk_id_2]

ANSWER RULES:
- Direct answer if information exists explicitly
- Synthesize from related content if not explicit
- For "conclusion/summary": use outcome and proposal statements
- For "limitations": look for constraints, assumptions, 
  approximations, or conditions where results may not hold -
  academic papers imply limitations without labeling them
- For "future work": if absent, synthesize from conclusion 
  what naturally follows from the authors' work
- For "methodology": look for algorithms, system design, 
  proposed schemes
- Only say "Not found in the paper." if NO chunk contains 
  anything relevant - never say this if related content exists
- Never hallucinate information not in the context

EXAMPLES:
Q: "What are the limitations?"
Good: "No explicit limitations section exists. Implied 
limitations include: (1) time estimation may be inaccurate 
under certain conditions (2) assumes general-purpose OS on 
IoT devices. [Sources: c9, c15]"
Bad: "Not found in the paper."

Q: "What is the future work?"
Good: "No explicit future work section. Based on the 
conclusion, natural extensions include evaluating under 
heterogeneous networks. [Sources: c25]"
Bad: "Not found in the paper."
"""

_client = Groq(api_key=settings.GROQ_API_KEY)


def build_prompt(chunks: list[dict], question: str) -> list[dict[str, str]]:
	context_blocks: list[str] = []
	for chunk in chunks:
		chunk_id = chunk.get("chunk_id", "unknown_chunk")
		section = chunk.get("section_heading", "Section Unknown")
		text = str(chunk.get("text", "")).strip()
		words = text.split()
		if len(words) > 300:
			text = " ".join(words[:300])
		context_blocks.append(f"[chunk_id: {chunk_id} | section: {section}]\n{text}")

	formatted_chunks = "\n\n".join(context_blocks)
	user_message = f"Context chunks:\n{formatted_chunks}\n\nQuestion: {question.strip()}"

	return [
		{"role": "system", "content": SYSTEM_PROMPT},
		{"role": "user", "content": user_message},
	]


def generate_answer(messages: list[dict[str, str]]) -> dict:
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
		print(f"Groq API error: {type(exc).__name__}: {exc}")
		raise HTTPException(status_code=502, detail="LLM service unavailable") from exc


def extract_sources(chunks: list[dict]) -> list[dict]:
	return [
		{
			"chunk_id": chunk.get("chunk_id"),
			"section": chunk.get("section_heading", "Section Unknown"),
		}
		for chunk in chunks
	]
