import numpy as np
import requests
from fastapi import HTTPException

from config import settings

HF_EMBEDDING_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"


def _get_hf_headers() -> dict[str, str]:
	token = settings.HF_TOKEN.strip()
	if not token:
		raise HTTPException(status_code=500, detail="HF_TOKEN not configured")
	return {"Authorization": f"Bearer {token}"}


def _fetch_embeddings(texts: list[str]) -> np.ndarray:
	response = requests.post(
		HF_EMBEDDING_URL,
		headers=_get_hf_headers(),
		json={"inputs": texts, "options": {"wait_for_model": True}},
		timeout=60,
	)

	if response.status_code >= 400:
		raise HTTPException(status_code=502, detail="Embedding service unavailable")

	data = response.json()
	embeddings = np.asarray(data, dtype=np.float32)

	if embeddings.ndim == 1:
		embeddings = embeddings.reshape(1, -1)
	elif embeddings.ndim == 3:
		embeddings = embeddings.mean(axis=1)

	return embeddings


def _l2_normalize(vectors: np.ndarray) -> np.ndarray:
	norms = np.linalg.norm(vectors, axis=1, keepdims=True)
	norms = np.clip(norms, 1e-12, None)
	return vectors / norms


def embed_texts(texts: list[str]) -> np.ndarray:
	if not texts:
		return np.empty((0, 384), dtype=np.float32)

	embeddings = _fetch_embeddings(texts)
	embeddings = _l2_normalize(embeddings)
	return embeddings


def embed_query(query: str) -> np.ndarray:
	embeddings = _fetch_embeddings([query])
	embeddings = _l2_normalize(embeddings)
	return embeddings
