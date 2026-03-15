import numpy as np
from sentence_transformers import SentenceTransformer

_model = None


def _get_model() -> SentenceTransformer:
	global _model
	if _model is None:
		_model = SentenceTransformer("all-MiniLM-L6-v2")
	return _model


def _l2_normalize(vectors: np.ndarray) -> np.ndarray:
	norms = np.linalg.norm(vectors, axis=1, keepdims=True)
	norms = np.clip(norms, 1e-12, None)
	return vectors / norms


def embed_texts(texts: list[str]) -> np.ndarray:
	if not texts:
		return np.empty((0, 384), dtype=np.float32)

	embeddings = _get_model().encode(texts, convert_to_numpy=True)
	embeddings = np.asarray(embeddings, dtype=np.float32)
	embeddings = _l2_normalize(embeddings)
	return embeddings


def embed_query(query: str) -> np.ndarray:
	embeddings = _get_model().encode([query], convert_to_numpy=True)
	embeddings = np.asarray(embeddings, dtype=np.float32)
	embeddings = _l2_normalize(embeddings)
	return embeddings
