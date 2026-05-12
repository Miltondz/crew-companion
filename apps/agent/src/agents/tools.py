"""Tool subsets for each specialist agent.

Each specialist gets a focused slice of CREW_TOOLS to reduce LLM confusion
and prompt token consumption.
"""
from ..tools import (
    create_task,
    update_task_status,
    create_milestone,
    resolve_blocker,
    get_documents,
    create_blocker,
    add_member,
    reset_workspace,
)

# Planner: operational tools — tasks, milestones, blockers, team structure
PLANNER_TOOLS = [
    create_task,
    update_task_status,
    create_milestone,
    resolve_blocker,
    create_blocker,
    add_member,
]

# Coach: read-only + blocker creation — guidance, docs, surfacing stuck state
COACH_TOOLS = [
    get_documents,
    create_blocker,
]

# Orchestrator: all tools (direct handling + delegation capability)
ORCHESTRATOR_TOOLS = [
    create_task,
    update_task_status,
    create_milestone,
    resolve_blocker,
    get_documents,
    create_blocker,
    add_member,
    reset_workspace,
]
