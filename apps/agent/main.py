"""LangGraph entry point for `langgraph dev --port 8123`.

Crew Companion agent — Phase 5 will wire crew_state, tools and prompts.
For now: boots a minimal noop graph so the BFF can connect.
"""

from __future__ import annotations

import os
from dotenv import load_dotenv
from src.intelligence_cleanup import wipe_orphan_threads

load_dotenv()

# Clean up orphan threads from previous dev sessions (same as starter kit)
wipe_orphan_threads()

_AGENT_RUNTIME = os.getenv("AGENT_RUNTIME", "gemini-flash-deep")
print(f"[runtime] AGENT_RUNTIME={_AGENT_RUNTIME}", flush=True)
print("[crew-companion] Phase 1 — agent placeholder. Full agent wired in Phase 5.", flush=True)

from src.runtime import build_graph

graph = build_graph("noop", tools=[], system_prompt="Crew Companion agent — coming soon.")


def main() -> None:
    import subprocess
    subprocess.run(["langgraph", "dev", "--port", "8123"], check=True)


if __name__ == "__main__":
    main()
