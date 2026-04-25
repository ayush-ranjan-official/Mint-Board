from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.article_store import init_db
from routers import analyze, articles, recommend


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    await init_db()
    yield


app = FastAPI(
    title="MintBoard AI Service",
    description="Content analysis, recommendations, and curation for MintBoard",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(analyze.router, tags=["Analysis"])
app.include_router(articles.router, tags=["Articles"])
app.include_router(recommend.router, tags=["Recommendations"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "mintboard-ai"}
