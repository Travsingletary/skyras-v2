from pathlib import Path
from typing import Optional

def export_markdown(store, source: Optional[str] = None) -> int:
    out_root = Path("docs/integrations")
    out_root.mkdir(parents=True, exist_ok=True)
    pages = store.list_pages(source)
    if source:
        pages = [p for p in pages if p["source"] == source]
    # Simple grouped MD per source
    grouped = {}
    for p in pages:
        grouped.setdefault(p["source"], []).append(p)
    written = 0
    for src, items in grouped.items():
        md = [f"# {src.title()} Documentation Index\n"]
        for it in items:
            md.append(f"- [{it.get('title') or it['url']}]({it['url']})  ")
        (out_root / f"{src}.md").write_text("\n".join(md), encoding="utf-8")
        written += 1
    return written




