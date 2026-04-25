from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.article_store import create_article, get_article, list_articles, get_next_id

router = APIRouter()


class StoreArticleRequest(BaseModel):
    title: str
    content: str
    summary: str = ""
    reading_time: int = 0
    quality_score: float = 0.0
    tags: List[str] = []
    seo_description: str = ""
    article_id: Optional[int] = None  # Optional: auto-assign if not provided


class StoreArticleResponse(BaseModel):
    article_id: int
    stored: bool


class ArticleResponse(BaseModel):
    article_id: int
    title: str
    content: str
    summary: str
    reading_time: int
    quality_score: float
    tags: List[str]
    seo_description: str
    created_at: str


class ArticleSummary(BaseModel):
    article_id: int
    title: str
    summary: str
    reading_time: int
    quality_score: float
    tags: List[str]


@router.post("/articles", response_model=StoreArticleResponse)
async def store_article(req: StoreArticleRequest):
    """Store article content in local SQLite database."""
    article_id = req.article_id if req.article_id is not None else await get_next_id()
    result = await create_article(
        article_id=article_id,
        title=req.title,
        content=req.content,
        summary=req.summary,
        reading_time=req.reading_time,
        quality_score=req.quality_score,
        tags=req.tags,
        seo_description=req.seo_description,
    )
    return StoreArticleResponse(**result)


@router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article_by_id(article_id: int):
    """Retrieve full article content by ID."""
    article = await get_article(article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleResponse(
        article_id=article["id"],
        title=article["title"],
        content=article["content"],
        summary=article.get("summary", ""),
        reading_time=article.get("reading_time", 0),
        quality_score=article.get("quality_score", 0.0),
        tags=article.get("tags", []),
        seo_description=article.get("seo_description", ""),
        created_at=article.get("created_at", ""),
    )


@router.get("/articles", response_model=List[ArticleSummary])
async def list_all_articles():
    """List all articles with summary metadata (no full content)."""
    articles = await list_articles()
    return [
        ArticleSummary(
            article_id=a["id"],
            title=a["title"],
            summary=a.get("summary", ""),
            reading_time=a.get("reading_time", 0),
            quality_score=a.get("quality_score", 0.0),
            tags=a.get("tags", []),
        )
        for a in articles
    ]
