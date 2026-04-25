from datetime import datetime


def get_recommendations(all_articles: list, read_article_ids: set, limit: int = 5) -> dict:
    """Simple recommendation engine based on quality score and recency."""
    # Filter out already-read articles
    unread = [a for a in all_articles if a["id"] not in read_article_ids]

    if not unread:
        return {
            "recommended_article_ids": [],
            "reasoning": "You've read all available articles!",
        }

    # Score articles: quality_score * recency_weight
    now = datetime.utcnow()
    scored = []
    for article in unread:
        quality = article.get("quality_score", 5.0)
        # Recency: articles from last 7 days get full weight, older articles decay
        created = article.get("created_at", now.isoformat())
        if isinstance(created, str):
            try:
                created_dt = datetime.fromisoformat(created)
            except ValueError:
                created_dt = now
        else:
            created_dt = created
        days_old = max(0, (now - created_dt).days)
        recency_weight = max(0.3, 1.0 - (days_old * 0.1))
        score = quality * recency_weight
        scored.append((article["id"], score))

    # Sort by combined score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    recommended_ids = [item[0] for item in scored[:limit]]

    return {
        "recommended_article_ids": recommended_ids,
        "reasoning": f"Recommended based on content quality and freshness. Excluded {len(read_article_ids)} already-read articles.",
    }
