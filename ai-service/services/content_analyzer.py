import os
import json
import math
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

ATXP_CONNECTION = os.getenv("ATXP_CONNECTION", "")


def get_client() -> OpenAI:
    return OpenAI(
        api_key=ATXP_CONNECTION,
        base_url="https://llm.atxp.ai/v1",
    )


def analyze_content(title: str, content: str) -> dict:
    """Analyze article content using ATXP LLM Gateway."""
    # Estimate reading time locally (more reliable than LLM)
    word_count = len(content.split())
    reading_time = max(1, math.ceil(word_count / 200))

    if not ATXP_CONNECTION:
        # Fallback when no API key: generate basic metadata
        return {
            "summary": f"An article about {title}.",
            "readingTimeMinutes": reading_time,
            "qualityScore": 7.0,
            "tags": ["General"],
            "seoDescription": title,
        }

    client = get_client()

    prompt = f"""Analyze this article and respond ONLY with valid JSON (no markdown, no code fences).

Title: {title}

Content:
{content[:3000]}

Respond with this exact JSON structure:
{{
  "summary": "A 2-3 sentence summary of the article.",
  "qualityScore": 7.5,
  "tags": ["Tag1", "Tag2", "Tag3"],
  "seoDescription": "A one-sentence SEO description."
}}

Quality score should be 1-10 based on clarity, depth, originality, and structure."""

    try:
        completion = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are a content analysis assistant. Respond only in valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )
        result_text = completion.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1]
            if result_text.endswith("```"):
                result_text = result_text[:-3].strip()

        result = json.loads(result_text)
        result["readingTimeMinutes"] = reading_time
        return result
    except Exception as e:
        print(f"[content_analyzer] LLM analysis failed: {e}")
        return {
            "summary": f"An article about {title}.",
            "readingTimeMinutes": reading_time,
            "qualityScore": 7.0,
            "tags": ["General"],
            "seoDescription": title,
        }


def compute_content_hash(content: str) -> str:
    """Compute keccak256 hash matching Solidity's keccak256(bytes(content))."""
    try:
        from web3 import Web3
        return Web3.solidity_keccak(["string"], [content]).hex()
    except ImportError:
        import hashlib
        return "0x" + hashlib.sha256(content.encode()).hexdigest()
