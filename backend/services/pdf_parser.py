import fitz
from fastapi import HTTPException, UploadFile


async def extract_text(file: UploadFile) -> str:
	contents = await file.read()
	doc = fitz.open(stream=contents, filetype="pdf")

	full_text: list[str] = []
	for page in doc:
		blocks = page.get_text("blocks")
		blocks = sorted(blocks, key=lambda b: (round(b[1] / 20) * 20, b[0]))
		for block in blocks:
			text = block[4].strip()
			if text:
				full_text.append(text)

	doc.close()
	result = "\n\n".join(full_text)

	if not result.strip():
		raise HTTPException(status_code=400, detail="Failed to parse PDF")

	return result
