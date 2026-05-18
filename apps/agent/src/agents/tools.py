"""Tool subsets for each specialist agent.

Each specialist gets a focused slice of CREW_TOOLS to reduce LLM confusion
and prompt token consumption.
"""
from ..tools import (
    create_task,
    update_task,
    update_task_status,
    delete_task,
    create_milestone,
    update_milestone,
    delete_milestone,
    resolve_blocker,
    get_documents,
    create_blocker,
    update_blocker,
    delete_blocker,
    add_member,
    update_member,
    delete_member,
    reset_workspace,
    create_document,
    update_document,
    delete_document,
)

# Planner: full operational control — tasks, milestones, blockers, team, documents
PLANNER_TOOLS = [
    create_task,
    update_task,
    update_task_status,
    delete_task,
    create_milestone,
    update_milestone,
    delete_milestone,
    resolve_blocker,
    create_blocker,
    update_blocker,
    delete_blocker,
    add_member,
    update_member,
    delete_member,
    create_document,
    update_document,
    delete_document,
]

# Coach: read-only + blocker creation — guidance, docs, surfacing stuck state
COACH_TOOLS = [
    get_documents,
    create_blocker,
    update_task_status,
]

# Orchestrator: all tools (direct handling + delegation capability)
ORCHESTRATOR_TOOLS = [
    create_task,
    update_task,
    update_task_status,
    delete_task,
    create_milestone,
    update_milestone,
    delete_milestone,
    resolve_blocker,
    get_documents,
    create_blocker,
    update_blocker,
    delete_blocker,
    add_member,
    update_member,
    delete_member,
    reset_workspace,
    create_document,
    update_document,
    delete_document,
]
