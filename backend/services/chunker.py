import re


CHUNK_SIZE_WORDS = 600
OVERLAP_WORDS = 112


def _extract_section_heading(chunk_text: str) -> str:
	heading_starts = (
		"abstract",
		"introduction",
		"conclusion",
		"related work",
		"future work",
		"methodology",
		"results",
		"discussion",
	)

	for line in chunk_text.splitlines():
		candidate = line.strip()
		if not candidate:
			continue

		if re.match(r"^(?:\d+(?:\.\d+)*\.?|[IVXLCDM]+\.)\s*", candidate):
			return candidate

		candidate_lower = candidate.lower()
		if candidate_lower.startswith(heading_starts):
			return candidate

		letters_only = re.sub(r"[^A-Za-z]", "", candidate)
		if letters_only and candidate == candidate.upper() and len(candidate) < 60:
			return candidate

	return "Section Unknown"


def _split_long_paragraph(paragraph: str) -> list[str]:
	words = paragraph.split()
	if not words:
		return []

	chunks: list[str] = []
	step = max(1, CHUNK_SIZE_WORDS - OVERLAP_WORDS)

	start = 0
	while start < len(words):
		end = min(len(words), start + CHUNK_SIZE_WORDS)
		chunks.append(" ".join(words[start:end]).strip())
		if end >= len(words):
			break
		start += step

	return chunks


def _split_into_base_chunks(text: str) -> list[str]:
	paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
	if not paragraphs:
		return []

	base_chunks: list[str] = []
	current_parts: list[str] = []
	current_word_count = 0

	for paragraph in paragraphs:
		paragraph_words = paragraph.split()
		paragraph_word_count = len(paragraph_words)

		if paragraph_word_count > CHUNK_SIZE_WORDS:
			if current_parts:
				base_chunks.append("\n\n".join(current_parts).strip())
				current_parts = []
				current_word_count = 0

			base_chunks.extend(_split_long_paragraph(paragraph))
			continue

		if current_parts and current_word_count + paragraph_word_count > CHUNK_SIZE_WORDS:
			base_chunks.append("\n\n".join(current_parts).strip())
			current_parts = [paragraph]
			current_word_count = paragraph_word_count
		else:
			current_parts.append(paragraph)
			current_word_count += paragraph_word_count

	if current_parts:
		base_chunks.append("\n\n".join(current_parts).strip())

	return [chunk for chunk in base_chunks if chunk]


def chunk_text(text: str, paper_id: str) -> list[dict]:
	cleaned_text = text.strip()
	if not cleaned_text:
		return []

	base_chunks = _split_into_base_chunks(cleaned_text)
	if not base_chunks:
		return []

	with_overlap: list[str] = []
	previous_words: list[str] = []

	for index, chunk in enumerate(base_chunks):
		current_words = chunk.split()
		if index == 0:
			with_overlap.append(chunk)
		else:
			overlap_prefix = previous_words[-OVERLAP_WORDS:] if previous_words else []
			merged_words = overlap_prefix + current_words
			with_overlap.append(" ".join(merged_words).strip())

		previous_words = current_words

	chunks: list[dict] = []
	for index, chunk in enumerate(with_overlap):
		chunks.append(
			{
				"chunk_id": f"{paper_id}_c{index}",
				"paper_id": paper_id,
				"text": chunk,
				"page_estimate": index // 3 + 1,
				"section_heading": _extract_section_heading(chunk),
			}
		)

	return chunks
