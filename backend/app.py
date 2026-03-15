import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def _parse_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["*"]


def _register_routers(app: FastAPI) -> None:
    if getattr(app.state, "routers_registered", False):
        return

    from api.query import router as query_router
    from api.upload import router as upload_router

    app.include_router(upload_router)
    app.include_router(query_router)
    app.state.routers_registered = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv()
    _register_routers(app)
    port = os.environ.get("PORT", "NOT SET")
    print(f"Starting PaperPilot on PORT={port}")
    print("PaperPilot backend running")
    yield


app = FastAPI(title="PaperPilot API", lifespan=lifespan)

allowed_origins = _parse_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
