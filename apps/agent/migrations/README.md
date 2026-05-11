# Migrations

SQL migrations applied in filename-numeric order by `scripts/migrate.sh`.

Run:
```bash
bash scripts/migrate.sh up      # apply pending
bash scripts/migrate.sh status  # list applied vs pending
```

Rules:
- Idempotent — re-running `up` is safe
- Never rename or delete an applied migration; add a new one instead
- Tracked in `_migrations` meta table
