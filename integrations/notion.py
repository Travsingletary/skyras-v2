"""Notion project tracker stub client."""

from __future__ import annotations

from typing import Dict, Any, List

from .base import IntegrationClient, IntegrationStatus


class NotionClient(IntegrationClient):
    name = "notion"

    def __init__(self, api_key: str | None = None, database_id: str | None = None):
        super().__init__(api_key_env="NOTION_API_KEY", api_key=api_key)
        self.database_id = database_id

    async def create_page(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        if not self.configured or not self.database_id:
            return {"success": False, "error": "Notion client not configured"}
        # Placeholder describing the contract; actual HTTP call lives in services/marcus.
        return {"success": True, "page_id": "page_stub", "properties": properties}

    async def query_pages(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        if not self.configured:
            return []
        return [{"id": "example", "filters": filters}]

    def health(self) -> IntegrationStatus:
        status = super().health()
        if status.configured and not self.database_id:
            status.detail = "Missing NOTION_DATABASE_ID"
        elif not status.configured:
            status.detail = "Set NOTION_API_KEY to enable Notion integration"
        return status


__all__ = ["NotionClient"]
