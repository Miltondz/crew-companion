from __future__ import annotations

import json
from pathlib import Path

from .capabilities import Capability

_DATA = json.loads((Path(__file__).parent / "role_grants.json").read_text())


def role_grants_for(role: str) -> frozenset[Capability]:
    """Return the capability grant set for a role. Unknown roles → empty set."""
    raw = _DATA.get(role, [])
    result: set[Capability] = set()
    for v in raw:
        try:
            result.add(Capability(v))
        except ValueError:
            pass
    return frozenset(result)
