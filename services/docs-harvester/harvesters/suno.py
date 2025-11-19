from ._core import fetch_html, extract_links, hash_content
from .sources import SOURCES

async def harvest(store, deep: bool = False):
    base = SOURCES["suno"]["base_url"]
    try:
        html = await fetch_html(base)
    except Exception:
        # Handle invite-only/unavailable gracefully
        store.upsert_page("suno", base, hash_content("unavailable"), title_hint="Suno Docs (status)")
        store.touch_source("suno")
        return {"pages": 1, "note": "status/unavailable"}
    pages = [base] + (extract_links(base, html, 10) if deep else [])
    count = 0
    for url in pages:
        text = await fetch_html(url)
        h = hash_content(text)
        count += store.upsert_page("suno", url, h, title_hint="Suno Docs")
    store.touch_source("suno")
    return {"pages": count}




