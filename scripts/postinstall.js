const { execSync, spawnSync } = require('child_process')

const check = spawnSync('uv', ['--version'], { stdio: 'pipe', shell: true })
if (check.status === 0) {
  execSync('uv sync', { cwd: 'apps/agent', stdio: 'inherit', shell: true })
}
