import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import HarvestRequest
from storage.supabase import SupabaseStore
from harvesters.dispatch import run_harvest
from export.markdown import export_markdown

app = FastAPI(title="Docs Harvester Agent", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

store = SupabaseStore()

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/sources")
async def sources():
    return store.list_sources()

@app.get("/pages")
async def pages(source: Optional[str] = None):
    return store.list_pages(source)

@app.post("/harvest/run")
async def harvest(req: HarvestRequest):
    try:
        result = await run_harvest(req, store)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export/md")
async def export_md(source: Optional[str] = None):
    try:
        count = export_markdown(store, source)
        return {"success": True, "written": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




