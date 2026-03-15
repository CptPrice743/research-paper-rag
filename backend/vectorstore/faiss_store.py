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
	for score, chunk_idx in zip(scores[0], indices[0]):
		if chunk_idx < 0:
			continue
		chunk = dict(chunks[int(chunk_idx)])
		chunk["score"] = float(score)
		results.append(chunk)
		returned_indices.append(int(chunk_idx))

	# Ensure chunk index 0 (title/abstract/introduction) is always included.
	if chunks and 0 not in returned_indices:
		intro_vector = np.empty(index.d, dtype=np.float32)
		index.reconstruct(0, intro_vector)
		intro_score = float(np.dot(query[0], intro_vector))

		intro_chunk = dict(chunks[0])
		intro_chunk["score"] = intro_score

		if not results:
			results.append(intro_chunk)
		elif len(results) >= k:
			results[-1] = intro_chunk
		else:
			results.append(intro_chunk)

	return results
