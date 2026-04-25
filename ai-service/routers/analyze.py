from __future__ import annotations

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from services.content_analyzer import analyze_content, compute_content_hash

router = APIRouter()


class AnalyzeRequest(BaseModel):
    title: str
    content: str


class AnalyzeResponse(BaseModel):
    summary: str
    readingTimeMinutes: int
    qualityScore: float
    tags: List[str]
    seoDescription: str
    contentHash: str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_article(req: AnalyzeRequest):
    """Analyze article content using AI and return structured metadata."""
    result = analyze_content(req.title, req.content)
    content_hash = compute_content_hash(req.content)
    return AnalyzeResponse(
        summary=result.get("summary", ""),
        readingTimeMinutes=result.get("readingTimeMinutes", 1),
        qualityScore=result.get("qualityScore", 5.0),
        tags=result.get("tags", []),
        seoDescription=result.get("seoDescription", ""),
        contentHash=content_hash,
    )
