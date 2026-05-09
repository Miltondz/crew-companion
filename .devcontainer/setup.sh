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

# 3. Create .env files from example if they don't exist yet
if [ ! -f .env ]; then
  echo "▶ Creating .env from .env.example..."
  cp .env.example .env
fi

# The Python agent reads its own .env from apps/agent/
if [ ! -f apps/agent/.env ]; then
  echo "▶ Copying .env to apps/agent/.env..."
  cp .env apps/agent/.env
fi

echo ""
echo "  ⚠️  Set these keys in .env (and apps/agent/.env) before running:"
echo ""
echo "     GEMINI_API_KEY        → https://aistudio.google.com"
echo "     COPILOTKIT_LICENSE_TOKEN → run: npm run license"
echo ""

echo ""
echo "✅ Setup complete. To start the project:"
echo ""
echo "   npm run dev:infra   # starts Postgres + Redis + Intelligence (Docker)"
echo "   npm run dev         # starts Frontend + BFF + Agent"
echo ""
echo "   Frontend  → http://localhost:3010"
echo "   BFF       → http://localhost:4000"
echo "   Agent     → http://localhost:8133"
echo ""
