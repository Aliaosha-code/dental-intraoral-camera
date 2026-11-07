import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const electronBinary = require('electron')

const env = { ...process.env }
// Some harness terminals set this to reuse the bundled Node runtime; Electron
// must start as a desktop process instead of a headless Node process.
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(electronBinary, ['.'], {
  cwd: root,
  env,
  stdio: 'inherit',
  windowsHide: false,
})

child.on('error', (error) => {
  console.error('无法启动 Electron：', error.message)
  process.exitCode = 1
})

child.on('exit', (code) => {
  process.exitCode = code ?? 0
})
