import numpy as np
from sentence_transformers import SentenceTransformer

# Load once at module import time (singleton-style for process lifetime).
_MODEL = SentenceTransformer("all-MiniLM-L6-v2")


def _l2_normalize(vectors: np.ndarray) -> np.ndarray:
	norms = np.linalg.norm(vectors, axis=1, keepdims=True)
	norms = np.clip(norms, 1e-12, None)
	return vectors / norms


def embed_texts(texts: list[str]) -> np.ndarray:
	if not texts:
		return np.empty((0, 384), dtype=np.float32)

	embeddings = _MODEL.encode(texts, convert_to_numpy=True)
	embeddings = np.asarray(embeddings, dtype=np.float32)
	embeddings = _l2_normalize(embeddings)
	return embeddings


def embed_query(query: str) -> np.ndarray:
	embeddings = _MODEL.encode([query], convert_to_numpy=True)
	embeddings = np.asarray(embeddings, dtype=np.float32)
	embeddings = _l2_normalize(embeddings)
	return embeddings
