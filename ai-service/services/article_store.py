from __future__ import annotations

import aiosqlite
import json
import os
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mintboard.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT DEFAULT '',
                reading_time INTEGER DEFAULT 0,
                quality_score REAL DEFAULT 0.0,
                tags TEXT DEFAULT '[]',
                seo_description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()


async def create_article(article_id: int, title: str, content: str,
                         summary: str = "", reading_time: int = 0,
                         quality_score: float = 0.0, tags: list = None,
                         seo_description: str = "") -> dict:
    tags = tags or []
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO articles
               (id, title, content, summary, reading_time, quality_score, tags, seo_description, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (article_id, title, content, summary, reading_time,
             quality_score, json.dumps(tags), seo_description, datetime.utcnow().isoformat())
        )
        await db.commit()
    return {"article_id": article_id, "stored": True}


async def get_article(article_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM articles WHERE id = ?", (article_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        return _row_to_dict(row)


async def list_articles() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM articles ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [_row_to_dict(row) for row in rows]


async def update_metadata(article_id: int, summary: str, reading_time: int,
                          quality_score: float, tags: list, seo_description: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """UPDATE articles
               SET summary = ?, reading_time = ?, quality_score = ?, tags = ?, seo_description = ?
               WHERE id = ?""",
            (summary, reading_time, quality_score, json.dumps(tags), seo_description, article_id)
        )
        await db.commit()


async def get_next_id() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT MAX(id) FROM articles")
        row = await cursor.fetchone()
        return (row[0] or -1) + 1


def _row_to_dict(row) -> dict:
    d = dict(row)
    if isinstance(d.get("tags"), str):
        d["tags"] = json.loads(d["tags"])
    return d
