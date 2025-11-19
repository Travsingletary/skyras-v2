from typing import Optional
from pydantic import BaseModel


class HarvestRequest(BaseModel):
    source: Optional[str] = None
    deep: bool = False




