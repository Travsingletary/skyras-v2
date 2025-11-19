from ._core import fetch_html, extract_links, hash_content
from .sources import SOURCES

async def harvest(store, deep: bool = False):
    base = SOURCES["socialite"]["base_url"]
    html = await fetch_html(base)
    pages = [base] + (extract_links(base, html, 15) if deep else [])
    count = 0
    for url in pages:
        text = await fetch_html(url)
        h = hash_content(text)
        count += store.upsert_page("socialite", url, h, title_hint="Socialite Docs")
    store.touch_source("socialite")
    return {"pages": count}




