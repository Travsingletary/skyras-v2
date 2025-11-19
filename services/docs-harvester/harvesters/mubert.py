from ._core import fetch_html, extract_links, hash_content
from .sources import SOURCES

async def harvest(store, deep: bool = False):
    base = SOURCES["mubert"]["base_url"]
    html = await fetch_html(base)
    pages = [base] + (extract_links(base, html, 10) if deep else [])
    count = 0
    for url in pages:
        text = await fetch_html(url)
        h = hash_content(text)
        count += store.upsert_page("mubert", url, h, title_hint="Mubert API")
    store.touch_source("mubert")
    return {"pages": count}




