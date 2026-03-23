from typing import Any

import faiss
import numpy as np
from fastapi import HTTPException

# In-memory only store (suitable for local dev / simple deployments).
# Note: Render free tier is ephemeral; for production use a persistent vector DB
# (e.g., Pinecone) or persist vectors/metadata to object storage.
_store: dict[str, dict[str, Any]] = {}


def save_paper(paper_id: str, chunks: list[dict], embeddings: np.ndarray) -> None:
	if len(chunks) != int(embeddings.shape[0]):
		raise ValueError("Chunks and embeddings count mismatch")

	vectors = np.asarray(embeddings, dtype=np.float32)
	index = faiss.IndexFlatIP(vectors.shape[1])
	index.add(vectors)

	_store[paper_id] = {
		"index": index,
		"chunks": chunks,
	}


def search(paper_id: str, query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
	paper_data = _store.get(paper_id)
	if paper_data is None:
		raise HTTPException(status_code=404, detail="Paper not found")

	index: faiss.Index = paper_data["index"]
	chunks: list[dict] = paper_data["chunks"]

	query = np.asarray(query_embedding, dtype=np.float32)
	k = min(top_k, len(chunks))
	if k <= 0:
		return []

	scores, indices = index.search(query, k)

	results: list[dict] = []
	returned_indices: list[int] = []
	returned_index_set: set[int] = set()
	for score, chunk_idx in zip(scores[0], indices[0]):
		if chunk_idx < 0:
			continue
		idx = int(chunk_idx)
		chunk = dict(chunks[idx])
		chunk["score"] = float(score)
		results.append(chunk)
		returned_indices.append(idx)
		returned_index_set.add(idx)

	def _append_chunk_if_missing(chunk_idx: int) -> None:
		if chunk_idx < 0 or chunk_idx >= len(chunks) or chunk_idx in returned_index_set:
			return

		vector = np.empty(index.d, dtype=np.float32)
		index.reconstruct(chunk_idx, vector)
		score = float(np.dot(query[0], vector))

		chunk = dict(chunks[chunk_idx])
		chunk["score"] = score
		results.append(chunk)
		returned_indices.append(chunk_idx)
		returned_index_set.add(chunk_idx)

	def _find_conclusion_anchor_idx() -> int | None:
		keywords = (
			"conclusion",
			"future work",
			"limitations",
			"discussion",
			"summary",
			"we propose",
			"in this paper we",
		)

		start_idx = max(0, len(chunks) - 8)
		for idx in range(len(chunks) - 1, start_idx - 1, -1):
			text = str(chunks[idx].get("text", "")).lower()
			if any(keyword in text for keyword in keywords):
				return idx

		return None

	# Ensure chunk c0 (intro/abstract) is present.
	_append_chunk_if_missing(0)

	# Add a smarter conclusion-style anchor from the trailing section when detectable.
	conclusion_idx = _find_conclusion_anchor_idx()
	if conclusion_idx is not None:
		_append_chunk_if_missing(conclusion_idx)

	max_results = min(len(chunks), top_k + 2)
	if len(results) > max_results:
		results = results[:max_results]

	return results
