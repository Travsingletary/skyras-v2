from ._core import fetch_html, extract_links, hash_content
from .sources import SOURCES

async def harvest(store, deep: bool = False):
    base = SOURCES["n8n"]["base_url"]
    html = await fetch_html(base)
    pages = [base] + (extract_links(base, html, 30) if deep else [])
    count = 0
    for url in pages:
        text = await fetch_html(url)
        h = hash_content(text)
        count += store.upsert_page("n8n", url, h, title_hint="n8n Docs")
    store.touch_source("n8n")
    return {"pages": count}




