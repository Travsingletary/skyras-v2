from .sources import SOURCES
from .heygen import harvest as harvest_heygen
from .elevenlabs import harvest as harvest_elevenlabs
from .leonardo import harvest as harvest_leonardo
from .n8n import harvest as harvest_n8n
from .supabase_docs import harvest as harvest_supabase
from .socialite import harvest as harvest_socialite
from .suno import harvest as harvest_suno
from .boomy import harvest as harvest_boomy
from .mubert import harvest as harvest_mubert

HARVESTERS = {
    "heygen": harvest_heygen,
    "elevenlabs": harvest_elevenlabs,
    "leonardo": harvest_leonardo,
    "n8n": harvest_n8n,
    "supabase": harvest_supabase,
    "socialite": harvest_socialite,
    "suno": harvest_suno,
    "boomy": harvest_boomy,
    "mubert": harvest_mubert,
}

async def run_harvest(req, store):
    sources = [req.source] if req.source else list(HARVESTERS.keys())
    results = {}
    for src in sources:
        if src not in HARVESTERS:
            results[src] = {"success": False, "error": "unknown source"}
            continue
        results[src] = await HARVESTERS[src](store, deep=req.deep)
    return results




