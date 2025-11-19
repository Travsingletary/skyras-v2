"""Lightweight integration client scaffolding used by SkyRas agents."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class IntegrationStatus:
    name: str
    configured: bool
    detail: Optional[str] = None


class IntegrationClient:
    """Base class for typed integration clients."""

    name: str = "integration"

    def __init__(self, api_key_env: Optional[str] = None, api_key: Optional[str] = None):
        self.api_key_env = api_key_env
        self.api_key = api_key or (os.getenv(api_key_env) if api_key_env else None)

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def health(self) -> IntegrationStatus:
        return IntegrationStatus(name=self.name, configured=self.configured)
