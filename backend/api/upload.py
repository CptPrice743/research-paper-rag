from fastapi import APIRouter

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("")
def upload_paper():
	return {"message": "TODO: implement"}
