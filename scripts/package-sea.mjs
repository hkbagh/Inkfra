import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const isWin = process.platform === 'win32'
const outName = isWin ? 'inkfra.exe' : 'inkfra'
const outPath = path.resolve('release', outName)
const nodeBin = process.execPath

// 1. Build web app
execFileSync('npm.cmd', ['run', 'build'], { stdio: 'inherit', shell: true })

// 2. Generate SEA blob
execFileSync(process.execPath, ['--experimental-sea-config', 'sea-config.json'], { stdio: 'inherit' })

// 3. Copy node binary
fs.mkdirSync('release', { recursive: true })
fs.copyFileSync(nodeBin, outPath)
fs.chmodSync(outPath, 0o755)

// 4. Copy dist next to binary
const distSrc = path.resolve('dist')
const distDst = path.resolve('release', 'dist')
fs.rmSync(distDst, { recursive: true, force: true })
fs.cpSync(distSrc, distDst, { recursive: true })

// 5. Inject blob
execFileSync('npx.cmd', ['postject', outPath, 'NODE_SEA_BLOB', 'sea-prep.blob',
  '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'], { stdio: 'inherit', shell: true })

console.log(`Created ${outPath}`)
