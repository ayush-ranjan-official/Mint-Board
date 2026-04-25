from fastapi import APIRouter, Query
from services.article_store import list_articles
from services.recommender import get_recommendations

router = APIRouter()


@router.get("/recommend")
async def recommend_articles(
    reader_address: str = Query(default="", description="Reader wallet address"),
    limit: int = Query(default=5, ge=1, le=20),
    read_ids: str = Query(default="", description="Comma-separated list of already-read article IDs"),
):
    """Get personalized article recommendations."""
    all_articles = await list_articles()

    # Parse read IDs from query parameter
    read_article_ids = set()
    if read_ids:
        try:
            read_article_ids = {int(x.strip()) for x in read_ids.split(",") if x.strip()}
        except ValueError:
            pass

    result = get_recommendations(all_articles, read_article_ids, limit)
    return result
