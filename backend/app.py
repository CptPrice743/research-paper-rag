import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.usage_limiter import get_daily_count, get_tokens_today

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
    print(f"Starting PaperPilot — PORT env = {os.environ.get('PORT', 'NOT SET')}")
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


@app.get("/usage")
def get_usage():
    total_tokens = get_tokens_today()
    token_budget = 500000
    return {
        "tokens_today": total_tokens,
        "token_budget": token_budget,
        "token_percentage": min(100, round((total_tokens / token_budget) * 100, 1)),
        "queries_today": get_daily_count(),
        "resets_at": "midnight UTC",
    }

if __name__ == "__main__":
    import uvicorn
    import os

    port_str = os.environ.get("PORT", "")
    if port_str and port_str.strip().isdigit():
        port = int(port_str.strip())
    else:
        port = 8000

    print(f"PaperPilot starting on port {port}")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
