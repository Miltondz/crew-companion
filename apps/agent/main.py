"""LangGraph entry point for `langgraph dev --port 8123`.

Three graphs registered:
  default  — Orchestrator (primary entry point, delegates to specialists)
  planner  — Planning specialist (tasks, milestones, blockers)
  coach    — Coaching specialist (guidance, troubleshooting, docs)
"""

from __future__ import annotations

import os
from dotenv import load_dotenv
from src.intelligence_cleanup import wipe_orphan_threads

load_dotenv()

wipe_orphan_threads()

_AGENT_RUNTIME = os.getenv("AGENT_RUNTIME", "gemini-flash-deep")
print(f"[runtime] AGENT_RUNTIME={_AGENT_RUNTIME}", flush=True)

from src.agents.graph import build_orchestrator_graph, build_planner_graph, build_coach_graph

graph = build_orchestrator_graph()
planner_graph = build_planner_graph()
coach_graph = build_coach_graph()

print("[runtime] graphs: default (orchestrator), planner, coach", flush=True)


def main() -> None:
    import subprocess
    subprocess.run(["langgraph", "dev", "--port", "8123"], check=True)


if __name__ == "__main__":
    main()
