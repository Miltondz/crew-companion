#!/usr/bin/env bash
# Applies all SQL migrations in apps/agent/migrations/ in order.
set -euo pipefail
cd "$(dirname "$0")/.."
cd apps/agent
uv run python -m src.runtime.migrator "${1:-up}"
