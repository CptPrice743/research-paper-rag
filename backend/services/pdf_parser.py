import io
import re

import pdfplumber
from fastapi import HTTPException, UploadFile


def _clean_text(text: str) -> str:
	normalized = text.replace("\r\n", "\n").replace("\r", "\n")
	normalized = re.sub(r"[ \t]+", " ", normalized)

	lines = normalized.split("\n")
	cleaned_lines: list[str] = []
	previous_blank = False

	for line in lines:
		stripped = line.strip()
		if not stripped:
			if not previous_blank:
				cleaned_lines.append("")
			previous_blank = True
			continue

		cleaned_lines.append(stripped)
		previous_blank = False

	return "\n".join(cleaned_lines).strip()


def extract_text(file: UploadFile) -> str:
	try:
		file_bytes = file.file.read()
		file.file.seek(0)

		pages_text: list[str] = []
		with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
			for page in pdf.pages:
				page_text = page.extract_text() or ""
				if page_text.strip():
					pages_text.append(page_text)

		full_text = "\n\n".join(pages_text)
		return _clean_text(full_text)
	except Exception as exc:
		raise HTTPException(status_code=400, detail="Failed to parse PDF") from exc
