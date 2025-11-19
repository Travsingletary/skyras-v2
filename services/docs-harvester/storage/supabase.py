import os
import yaml
from datetime import datetime
from typing import Optional

try:
    from supabase import create_client
except Exception:
    create_client = None


class SupabaseStore:
    """Supabase-backed store with in-memory fallback if creds are missing."""

    def __init__(self):
        self.rows = {"sources": {}, "pages": {}}
        self.client = None
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        if url and key and create_client is not None:
            try:
                self.client = create_client(url, key)
            except Exception:
                self.client = None
        # Seed sources from YAML (idempotent)
        self._seed_sources_from_yaml()

    def _seed_sources_from_yaml(self):
        try:
            yaml_path = os.path.join(os.path.dirname(__file__), "..", "sources.yaml")
            yaml_path = os.path.abspath(yaml_path)
            if not os.path.exists(yaml_path):
                return
            with open(yaml_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
            for key, meta in data.items():
                self._upsert_source_row(
                    name=key,
                    base_url=meta.get("base_url"),
                    category=meta.get("category"),
                    auth_type=meta.get("auth_type"),
                    status_page_url=meta.get("status_page_url"),
                )
        except Exception:
            pass

    def _upsert_source_row(self, name: str, base_url: Optional[str], category: Optional[str], auth_type: Optional[str], status_page_url: Optional[str]):
        now = datetime.utcnow().isoformat()
        if self.client:
            try:
                # Upsert by unique name
                self.client.table("docs_sources").upsert({
                    "name": name,
                    "base_url": base_url,
                    "category": category,
                    "auth_type": auth_type,
                    "status_page_url": status_page_url,
                    "last_checked_at": None,
                }, on_conflict="name").execute()
                return
            except Exception:
                pass
        # Fallback in-memory
        self.rows["sources"][name] = {
            "name": name,
            "base_url": base_url,
            "category": category,
            "auth_type": auth_type,
            "status_page_url": status_page_url,
            "last_checked_at": None,
        }

    def upsert_page(self, source: str, url: str, content_hash: str, title_hint: str = "") -> int:
        now = datetime.utcnow().isoformat()
        if self.client:
            try:
                # Upsert by unique url
                self.client.table("docs_pages").upsert({
                    "source_name": source,
                    "url": url,
                    "hash": content_hash,
                    "title": title_hint,
                    "last_seen_at": now,
                }, on_conflict="url").execute()
                return 1
            except Exception:
                pass
        # Fallback in-memory
        key = f"{source}|{url}"
        prev = self.rows["pages"].get(key)
        if prev and prev.get("hash") == content_hash:
            return 0
        self.rows["pages"][key] = {
            "source": source,
            "url": url,
            "hash": content_hash,
            "title": title_hint,
            "last_seen_at": now,
        }
        return 1

    def touch_source(self, source: str):
        now = datetime.utcnow().isoformat()
        if self.client:
            try:
                self.client.table("docs_sources").upsert({
                    "name": source,
                    "last_checked_at": now,
                }, on_conflict="name").execute()
                return
            except Exception:
                pass
        # Fallback in-memory
        self.rows["sources"].setdefault(source, {"name": source})
        self.rows["sources"][source]["last_checked_at"] = now

    def list_sources(self):
        if self.client:
            try:
                resp = self.client.table("docs_sources").select("*").execute()
                return resp.data or []
            except Exception:
                pass
        return sorted([{ "name": k, **v } for k, v in self.rows["sources"].items()], key=lambda x: x["name"]) if self.rows["sources"] else []

    def list_pages(self, source: Optional[str] = None):
        if self.client:
            try:
                query = self.client.table("docs_pages").select("*")
                if source:
                    query = query.eq("source_name", source)
                resp = query.execute()
                return resp.data or []
            except Exception:
                pass
        items = [v for v in self.rows["pages"].values()]
        if source:
            items = [v for v in items if v["source"] == source]
        return sorted(items, key=lambda x: (x["source"], x["url"]))


