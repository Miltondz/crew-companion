#!/usr/bin/env bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Crew Companion — Dev Environment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Install uv if not present (fast Python package manager)
if ! command -v uv &>/dev/null; then
  echo "▶ Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

# 2. Node dependencies (also triggers postinstall → uv sync for the agent)
echo "▶ Installing Node dependencies..."
npm install

# 3. Create .env from example, then inject any keys already set in the environment
#    (Daytona injects workspace env vars — this picks them up automatically)
if [ ! -f .env ]; then
  echo "▶ Creating .env from .env.example..."
  cp .env.example .env
fi

# Inject env vars from the Daytona workspace (or any pre-set shell env)
_inject_env() {
  local key="$1"
  local val="${!key}"
  if [ -n "$val" ]; then
    # Replace the line for this key if it exists, otherwise append
    if grep -q "^${key}=" .env; then
      sed -i "s|^${key}=.*|${key}=${val}|" .env
    else
      echo "${key}=${val}" >> .env
    fi
    echo "  ✓ ${key} injected"
  fi
}

echo "▶ Injecting environment variables..."
_inject_env GEMINI_API_KEY
_inject_env COPILOTKIT_LICENSE_TOKEN
_inject_env ANTHROPIC_API_KEY

# 4. Copy .env to the Python agent (it reads from its own directory)
echo "▶ Syncing .env to apps/agent/.env..."
cp .env apps/agent/.env

# 5. Check if required keys are present
echo ""
MISSING=0
if grep -q "stub-replace" .env; then
  echo "  ⚠️  GEMINI_API_KEY not set — add it in Daytona's env vars or edit .env"
  MISSING=1
fi
if grep -q "^COPILOTKIT_LICENSE_TOKEN=$" .env; then
  echo "  ⚠️  COPILOTKIT_LICENSE_TOKEN not set — run: npm run license"
  MISSING=1
fi

if [ "$MISSING" -eq 0 ]; then
  echo "  ✅ All required keys are set"
fi

echo ""
echo "✅ Setup complete. To start the project:"
echo ""
echo "   npm run dev:infra   # Postgres + Redis + Intelligence (Docker)"
echo "   npm run dev         # Frontend + BFF + Agent"
echo ""
echo "   Frontend  → http://localhost:3010"
echo "   BFF       → http://localhost:4000"
echo "   Agent     → http://localhost:8133"
echo ""
