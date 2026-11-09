import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')
const port = process.env.PORT ? Number(process.env.PORT) : 4173

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0])
  if (urlPath === '/') urlPath = '/index.html'
  const filePath = path.join(distDir, urlPath)
  if (!filePath.startsWith(distDir)) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(distDir, 'index.html'), (e2, d2) => {
        if (e2) { res.statusCode = 404; res.end('Not found'); return }
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(d2)
      })
      return
    }
    const ext = path.extname(filePath)
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
    res.end(data)
  })
})

server.listen(port, () => {
  const url = `http://localhost:${port}`
  console.log(`Inkfra running at ${url}`)
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`
  exec(cmd)
})
