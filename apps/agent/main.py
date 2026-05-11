"""LangGraph entry point for `langgraph dev --port 8123`."""

from __future__ import annotations

import os
from dotenv import load_dotenv
from src.intelligence_cleanup import wipe_orphan_threads

load_dotenv()

wipe_orphan_threads()

_AGENT_RUNTIME = os.getenv("AGENT_RUNTIME", "gemini-flash-deep")
print(f"[runtime] AGENT_RUNTIME={_AGENT_RUNTIME}", flush=True)

from src.runtime_factory import build_graph
from src.tools import CREW_TOOLS
from src.prompts import SYSTEM_PROMPT

graph = build_graph(_AGENT_RUNTIME, tools=CREW_TOOLS, system_prompt=SYSTEM_PROMPT)


def main() -> None:
    import subprocess
    subprocess.run(["langgraph", "dev", "--port", "8123"], check=True)


if __name__ == "__main__":
    main()
