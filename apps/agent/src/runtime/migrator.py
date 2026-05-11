"""SQL migration runner.

Applies files in apps/agent/migrations/*.sql in filename-numeric order.
Tracks applied migrations in a `_migrations` meta table. Idempotent.

Usage:
    python -m src.runtime.migrator up       # apply pending
    python -m src.runtime.migrator status   # list applied + pending
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg  # type: ignore[import-not-found]


def _conn_string() -> str:
    dsn = os.getenv("DATABASE_URL")
    if dsn:
        return dsn
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_HOST_PORT", "5433")
    user = os.getenv("POSTGRES_USER", "intelligence")
    pwd = os.getenv("POSTGRES_PASSWORD", "intelligence")
    db = os.getenv("INTELLIGENCE_DATABASE", "intelligence_app")
    return f"postgresql://{user}:{pwd}@{host}:{port}/{db}"


def _migrations_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "migrations"


def _list_files() -> list[Path]:
    return sorted(_migrations_dir().glob("*.sql"))


def _ensure_meta(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
          name       text        PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )


def _applied(cur) -> set[str]:
    cur.execute("SELECT name FROM _migrations")
    return {row[0] for row in cur.fetchall()}


def up() -> int:
    files = _list_files()
    if not files:
        print("[migrator] no migration files found", flush=True)
        return 0
    try:
        with psycopg.connect(_conn_string(), connect_timeout=5) as conn:
            with conn.cursor() as cur:
                _ensure_meta(cur)
                done = _applied(cur)
            applied_count = 0
            for f in files:
                if f.name in done:
                    continue
                sql = f.read_text(encoding="utf-8")
                with conn.cursor() as cur:
                    cur.execute(sql)
                    cur.execute(
                        "INSERT INTO _migrations (name) VALUES (%s)", (f.name,)
                    )
                conn.commit()
                applied_count += 1
                print(f"[migrator] applied {f.name}", flush=True)
            if applied_count == 0:
                print("[migrator] nothing to apply", flush=True)
            return 0
    except Exception as e:  # noqa: BLE001
        print(f"[migrator] FAILED: {type(e).__name__}: {e}", flush=True)
        return 1


def status() -> int:
    files = _list_files()
    try:
        with psycopg.connect(_conn_string(), connect_timeout=5) as conn:
            with conn.cursor() as cur:
                _ensure_meta(cur)
                done = _applied(cur)
        for f in files:
            mark = "✓" if f.name in done else " "
            print(f"  [{mark}] {f.name}")
        return 0
    except Exception as e:  # noqa: BLE001
        print(f"[migrator] FAILED: {type(e).__name__}: {e}", flush=True)
        return 1


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    cmd = argv[0] if argv else "up"
    if cmd == "up":
        return up()
    if cmd == "status":
        return status()
    print(f"[migrator] unknown command: {cmd!r}. Use 'up' or 'status'.", flush=True)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
