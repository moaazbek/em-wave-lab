/** Serve `dist/` with `vite preview` on a fixed port for the guide scripts, and stop it afterwards. */
import { spawn } from 'node:child_process'
import { join } from 'node:path'

const PORT = 4317

export async function startPreview(root: string): Promise<{ url: string; stop: () => void }> {
  const url = `http://localhost:${PORT}`
  const vite = join(root, 'node_modules/.bin/vite')
  const child = spawn(vite, ['preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))
  const stop = () => { if (!child.killed) child.kill() }
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`vite preview stopped:\n${log}`)
    try {
      if ((await fetch(url)).ok) return { url, stop }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100))
  }
  stop()
  throw new Error(`vite preview did not start on port ${PORT}:\n${log}`)
}
