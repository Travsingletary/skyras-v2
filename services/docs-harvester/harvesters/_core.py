import hashlib
import httpx
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

ALLOWED_HOSTS = {
    "docs.heygen.com", "api.elevenlabs.io", "docs.leonardo.ai",
    "docs.n8n.io", "supabase.com", "socialite.dev", "docs.suno.ai",
    "api.boomy.com", "mubert.com"
}

async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.text

def extract_links(base_url: str, html: str, max_links: int = 40):
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for a in soup.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        url = urljoin(base_url, href)
        host = urlparse(url).netloc
        if host in ALLOWED_HOSTS and url.startswith(base_url):
            out.append(url)
        if len(out) >= max_links:
            break
    return out

def hash_content(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()




