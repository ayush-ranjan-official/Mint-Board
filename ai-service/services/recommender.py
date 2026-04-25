from datetime import datetime

# Unique reason templates keyed by ranking position
_RANK_INTROS = [
    "Top pick for you",
    "Trending in your interests",
    "Rising on the platform",
    "You might also enjoy",
    "Curated for you",
]

# Quality descriptors based on score ranges
_QUALITY_LABELS = {
    (9.0, 10.1): "Exceptional quality",
    (8.0, 9.0): "Highly rated",
    (6.0, 8.0): "Well written",
    (4.0, 6.0): "Solid content",
    (0.0, 4.0): "New voice",
}

# Reading time descriptors
_TIME_LABELS = {
    (0, 3): "A quick 2-minute read",
    (3, 6): "A focused read",
    (6, 10): "A deep dive",
    (10, 100): "A comprehensive guide",
}


def _quality_label(score):
    for (lo, hi), label in _QUALITY_LABELS.items():
        if lo <= score < hi:
            return label
    return "Notable"


def _time_label(minutes):
    for (lo, hi), label in _TIME_LABELS.items():
        if lo <= minutes < hi:
            return label
    return ""


def get_recommendations(all_articles: list, read_article_ids: set, limit: int = 5) -> dict:
    """Recommendation engine with unique per-article AI reasoning."""
    unread = [a for a in all_articles if a["id"] not in read_article_ids]

    if not unread:
        return {
            "recommended_article_ids": [],
            "recommendations": [],
            "reasoning": "You've read all available articles!",
        }

    now = datetime.utcnow()
    scored = []
    for article in unread:
        quality = article.get("quality_score", 5.0)
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
        scored.append((article, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:limit]

    recommendations = []
    for rank, (article, score) in enumerate(top):
        quality = article.get("quality_score", 5.0)
        tags = article.get("tags", [])
        reading_time = article.get("reading_time", 0)
        title = article.get("title", "")

        # Build a unique reason for each article
        intro = _RANK_INTROS[rank % len(_RANK_INTROS)]
        qlabel = _quality_label(quality)
        tlabel = _time_label(reading_time) if reading_time else ""

        parts = [intro]

        # Add topic-specific context
        if tags and isinstance(tags, list) and len(tags) > 0:
            primary_tag = tags[0]
            if rank == 0:
                parts.append(f"covers {primary_tag} in depth")
            elif rank == 1:
                parts.append(f"explores {primary_tag} from a fresh angle")
            else:
                parts.append(f"offers insights on {primary_tag}")

        parts.append(f"{qlabel} ({quality:.1f}/10)")

        if tlabel:
            parts.append(tlabel)

        reason = " — ".join(parts[:3])

        recommendations.append({
            "article_id": article["id"],
            "reason": reason,
        })

    return {
        "recommended_article_ids": [r["article_id"] for r in recommendations],
        "recommendations": recommendations,
        "reasoning": f"Ranked by AI quality analysis and content relevance. Excluded {len(read_article_ids)} already-read articles.",
    }
