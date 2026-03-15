from fastapi import APIRouter

router = APIRouter(prefix="/query", tags=["query"])


@router.post("")
def query_papers():
	return {"message": "TODO: implement"}
