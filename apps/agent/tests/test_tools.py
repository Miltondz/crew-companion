"""Unit tests for crew tool state transformations.

Calls the unwrapped inner functions directly (tool.func.__wrapped__) to test
state logic without triggering the policy engine or LangGraph interrupt machinery.
"""
from __future__ import annotations

from uuid import UUID

import pytest

from src.tools import (
    add_member,
    create_blocker,
    create_milestone,
    create_task,
    delete_blocker,
    delete_member,
    delete_milestone,
    delete_task,
    get_documents,
    reset_workspace,
    resolve_blocker,
    update_blocker,
    update_member,
    update_milestone,
    update_task,
    update_task_status,
)


def _fn(tool):
    """Return the raw inner function, bypassing the policy wrapper."""
    return tool.func.__wrapped__


def base_state(**overrides) -> dict:
    return {
        "tasks": [],
        "members": [],
        "milestones": [],
        "blockers": [],
        "sharedDocuments": [],
        "openDocumentIds": [],
        "highlightedTaskIds": [],
        "activeMilestoneId": None,
        **overrides,
    }


# ---------------------------------------------------------------------------
# create_task
# ---------------------------------------------------------------------------

class TestCreateTask:
    def test_adds_task_with_valid_uuid(self):
        state = base_state()
        cmd = _fn(create_task)(
            title="Build it", description="desc", assigned_to="m1", priority="medium", state=state
        )
        assert len(cmd.update["tasks"]) == 1
        task = cmd.update["tasks"][0]
        assert task["title"] == "Build it"
        assert task["status"] == "todo"
        UUID(task["id"])  # raises if invalid

    def test_preserves_existing_tasks(self):
        existing = {"id": "t-old", "title": "Old"}
        state = base_state(tasks=[existing])
        cmd = _fn(create_task)(
            title="New", description="", assigned_to="m1", priority="low", state=state
        )
        assert len(cmd.update["tasks"]) == 2

    def test_milestone_id_defaults_to_none(self):
        state = base_state()
        cmd = _fn(create_task)(
            title="T", description="", assigned_to="m1", priority="low", state=state
        )
        assert cmd.update["tasks"][0]["milestoneId"] is None


# ---------------------------------------------------------------------------
# update_task_status
# ---------------------------------------------------------------------------

class TestUpdateTaskStatus:
    def test_updates_matched_task(self):
        state = base_state(tasks=[{"id": "t1", "title": "T", "status": "todo"}])
        cmd = _fn(update_task_status)(task_id="t1", new_status="done", state=state)
        assert cmd.update["tasks"][0]["status"] == "done"

    def test_leaves_unmatched_tasks_unchanged(self):
        state = base_state(tasks=[{"id": "t1", "status": "todo"}, {"id": "t2", "status": "todo"}])
        cmd = _fn(update_task_status)(task_id="t99", new_status="done", state=state)
        assert all(t["status"] == "todo" for t in cmd.update["tasks"])


# ---------------------------------------------------------------------------
# update_task
# ---------------------------------------------------------------------------

class TestUpdateTask:
    def test_patches_only_given_fields(self):
        task = {"id": "t1", "title": "Old", "description": "desc", "assignedTo": "m1", "priority": "low"}
        state = base_state(tasks=[task])
        cmd = _fn(update_task)(task_id="t1", title="New", state=state)
        result = cmd.update["tasks"][0]
        assert result["title"] == "New"
        assert result["description"] == "desc"
        assert result["priority"] == "low"

    def test_no_args_is_noop(self):
        task = {"id": "t1", "title": "T", "description": "d", "assignedTo": "m1", "priority": "low"}
        state = base_state(tasks=[task])
        cmd = _fn(update_task)(task_id="t1", state=state)
        assert cmd.update["tasks"][0] == task


# ---------------------------------------------------------------------------
# delete_task
# ---------------------------------------------------------------------------

class TestDeleteTask:
    def test_removes_task(self):
        state = base_state(tasks=[{"id": "t1"}, {"id": "t2"}])
        cmd = _fn(delete_task)(task_id="t1", state=state)
        assert len(cmd.update["tasks"]) == 1
        assert cmd.update["tasks"][0]["id"] == "t2"

    def test_removes_task_id_from_milestone_taskIds(self):
        state = base_state(
            tasks=[{"id": "t1"}],
            milestones=[{"id": "ms1", "taskIds": ["t1", "t2"]}],
        )
        cmd = _fn(delete_task)(task_id="t1", state=state)
        assert "t1" not in cmd.update["milestones"][0]["taskIds"]
        assert "t2" in cmd.update["milestones"][0]["taskIds"]


# ---------------------------------------------------------------------------
# create_milestone
# ---------------------------------------------------------------------------

class TestCreateMilestone:
    def test_creates_and_sets_active(self):
        state = base_state()
        cmd = _fn(create_milestone)(
            title="v1.0", deadline_iso="2026-12-31T00:00:00Z", task_ids=["t1"], state=state
        )
        ms = cmd.update["milestones"][0]
        assert ms["title"] == "v1.0"
        assert cmd.update["activeMilestoneId"] == ms["id"]
        UUID(ms["id"])


# ---------------------------------------------------------------------------
# update_milestone
# ---------------------------------------------------------------------------

class TestUpdateMilestone:
    def test_patches_title_only(self):
        state = base_state(milestones=[{"id": "ms1", "title": "Old", "deadline": "2026-01-01T00:00:00Z"}])
        cmd = _fn(update_milestone)(milestone_id="ms1", title="New", state=state)
        assert cmd.update["milestones"][0]["title"] == "New"
        assert cmd.update["milestones"][0]["deadline"] == "2026-01-01T00:00:00Z"

    def test_patches_deadline_only(self):
        state = base_state(milestones=[{"id": "ms1", "title": "T", "deadline": "2026-01-01T00:00:00Z"}])
        cmd = _fn(update_milestone)(milestone_id="ms1", deadline_iso="2027-06-01T00:00:00Z", state=state)
        assert cmd.update["milestones"][0]["deadline"] == "2027-06-01T00:00:00Z"


# ---------------------------------------------------------------------------
# delete_milestone
# ---------------------------------------------------------------------------

class TestDeleteMilestone:
    def test_removes_milestone_and_updates_active(self):
        state = base_state(
            milestones=[{"id": "ms1"}, {"id": "ms2"}],
            activeMilestoneId="ms1",
        )
        cmd = _fn(delete_milestone)(milestone_id="ms1", state=state)
        assert len(cmd.update["milestones"]) == 1
        assert cmd.update["activeMilestoneId"] == "ms2"

    def test_clears_active_when_last_milestone_deleted(self):
        state = base_state(milestones=[{"id": "ms1"}], activeMilestoneId="ms1")
        cmd = _fn(delete_milestone)(milestone_id="ms1", state=state)
        assert cmd.update["activeMilestoneId"] is None


# ---------------------------------------------------------------------------
# create_blocker
# ---------------------------------------------------------------------------

class TestCreateBlocker:
    def test_creates_unresolved_blocker(self):
        state = base_state()
        cmd = _fn(create_blocker)(member_id="m1", description="CI broken", state=state)
        blocker = cmd.update["blockers"][0]
        assert blocker["memberId"] == "m1"
        assert blocker["description"] == "CI broken"
        assert blocker["resolved"] is False
        assert blocker["resolvedAt"] is None
        UUID(blocker["id"])


# ---------------------------------------------------------------------------
# resolve_blocker
# ---------------------------------------------------------------------------

class TestResolveBlocker:
    def test_marks_resolved_with_timestamp(self):
        state = base_state(blockers=[{"id": "b1", "resolved": False, "resolvedAt": None}])
        cmd = _fn(resolve_blocker)(blocker_id="b1", state=state)
        b = cmd.update["blockers"][0]
        assert b["resolved"] is True
        assert b["resolvedAt"] is not None

    def test_leaves_other_blockers_untouched(self):
        state = base_state(blockers=[{"id": "b1", "resolved": False}, {"id": "b2", "resolved": False}])
        cmd = _fn(resolve_blocker)(blocker_id="b1", state=state)
        assert cmd.update["blockers"][1]["resolved"] is False


# ---------------------------------------------------------------------------
# update_blocker
# ---------------------------------------------------------------------------

class TestUpdateBlocker:
    def test_updates_description(self):
        state = base_state(blockers=[{"id": "b1", "description": "old"}])
        cmd = _fn(update_blocker)(blocker_id="b1", description="new desc", state=state)
        assert cmd.update["blockers"][0]["description"] == "new desc"


# ---------------------------------------------------------------------------
# delete_blocker
# ---------------------------------------------------------------------------

class TestDeleteBlocker:
    def test_removes_blocker(self):
        state = base_state(blockers=[{"id": "b1"}, {"id": "b2"}])
        cmd = _fn(delete_blocker)(blocker_id="b1", state=state)
        assert len(cmd.update["blockers"]) == 1
        assert cmd.update["blockers"][0]["id"] == "b2"

    def test_clears_member_activeBlockerId(self):
        state = base_state(
            blockers=[{"id": "b1"}],
            members=[{"id": "m1", "activeBlockerId": "b1"}, {"id": "m2", "activeBlockerId": None}],
        )
        cmd = _fn(delete_blocker)(blocker_id="b1", state=state)
        assert cmd.update["members"][0]["activeBlockerId"] is None
        assert cmd.update["members"][1]["activeBlockerId"] is None


# ---------------------------------------------------------------------------
# add_member
# ---------------------------------------------------------------------------

class TestAddMember:
    def test_adds_member_with_valid_uuid(self):
        state = base_state()
        cmd = _fn(add_member)(name="Alice", role="leader", state=state)
        m = cmd.update["members"][0]
        assert m["name"] == "Alice"
        assert m["role"] == "leader"
        assert m["activeBlockerId"] is None
        UUID(m["id"])

    def test_default_technical_level(self):
        state = base_state()
        cmd = _fn(add_member)(name="Bob", role="member", state=state)
        assert cmd.update["members"][0]["technicalLevel"] == "low-tech"

    def test_custom_technical_level(self):
        state = base_state()
        cmd = _fn(add_member)(name="Dev", role="member", technical_level="high-tech", state=state)
        assert cmd.update["members"][0]["technicalLevel"] == "high-tech"


# ---------------------------------------------------------------------------
# update_member
# ---------------------------------------------------------------------------

class TestUpdateMember:
    def test_patches_name_only(self):
        state = base_state(members=[{"id": "m1", "name": "Old", "role": "member", "technicalLevel": "low-tech"}])
        cmd = _fn(update_member)(member_id="m1", name="New", state=state)
        r = cmd.update["members"][0]
        assert r["name"] == "New"
        assert r["role"] == "member"

    def test_patches_role_and_tech_level(self):
        state = base_state(members=[{"id": "m1", "name": "Dev", "role": "member", "technicalLevel": "low-tech"}])
        cmd = _fn(update_member)(member_id="m1", role="leader", technical_level="high-tech", state=state)
        r = cmd.update["members"][0]
        assert r["role"] == "leader"
        assert r["technicalLevel"] == "high-tech"
        assert r["name"] == "Dev"


# ---------------------------------------------------------------------------
# delete_member
# ---------------------------------------------------------------------------

class TestDeleteMember:
    def test_removes_member(self):
        state = base_state(members=[{"id": "m1"}, {"id": "m2"}])
        cmd = _fn(delete_member)(member_id="m1", state=state)
        assert len(cmd.update["members"]) == 1
        assert cmd.update["members"][0]["id"] == "m2"

    def test_removes_member_blockers(self):
        state = base_state(
            members=[{"id": "m1"}],
            blockers=[{"id": "b1", "memberId": "m1"}, {"id": "b2", "memberId": "m2"}],
        )
        cmd = _fn(delete_member)(member_id="m1", state=state)
        assert len(cmd.update["blockers"]) == 1
        assert cmd.update["blockers"][0]["id"] == "b2"


# ---------------------------------------------------------------------------
# get_documents
# ---------------------------------------------------------------------------

class TestGetDocuments:
    def test_returns_shared_documents(self):
        docs = [{"id": "d1", "title": "Spec"}]
        state = base_state(sharedDocuments=docs)
        result = _fn(get_documents)(state=state)
        assert result == docs

    def test_empty_state_returns_empty_list(self):
        result = _fn(get_documents)(state={})
        assert result == []


# ---------------------------------------------------------------------------
# reset_workspace
# ---------------------------------------------------------------------------

class TestResetWorkspace:
    def test_clears_all_when_confirmed(self):
        state = base_state(
            tasks=[{"id": "t1"}],
            members=[{"id": "m1"}],
            milestones=[{"id": "ms1"}],
            blockers=[{"id": "b1"}],
        )
        cmd = _fn(reset_workspace)(confirm=True, state=state)
        assert cmd.update["tasks"] == []
        assert cmd.update["members"] == []
        assert cmd.update["milestones"] == []
        assert cmd.update["blockers"] == []
        assert cmd.update["activeMilestoneId"] is None

    def test_noop_when_not_confirmed(self):
        state = base_state(tasks=[{"id": "t1"}])
        cmd = _fn(reset_workspace)(confirm=False, state=state)
        assert cmd.update == {}
