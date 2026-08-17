/**
 * Think Automation Lab — Playwright Codegen Local Server
 * -------------------------------------------------------
 * Optional companion server. When running, the web app's Codegen
 * feature will automatically trigger `npx playwright codegen`
 * instead of showing a manual copy-paste command.
 *
 * HOW TO START:
 *   node codegen-server.js
 *
 * (Keep this terminal window open while using Codegen from the app)
 */

const http = require('http');
const { spawn } = require('child_process');

const PORT = 4321;

const server = http.createServer((req, res) => {
  // CORS headers for localhost dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'playwright-codegen-server' }));
    return;
  }

  // Codegen endpoint
  if (req.method === 'POST' && req.url === '/codegen') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { url, browser = 'chromium', language = 'typescript', outputFile } = JSON.parse(body);

        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'URL is required' }));
          return;
        }

        // Build the playwright codegen command args
        const args = ['playwright', 'codegen'];
        if (browser && browser !== 'chromium') args.push('--browser', browser);
        if (language && language !== 'typescript') args.push('--lang', language);
        if (outputFile) args.push('--output', outputFile);
        args.push(url);

        console.log(`\n🎬 Launching: npx ${args.join(' ')}\n`);

        const proc = spawn('npx', args, {
          stdio: 'inherit',
          shell: true,
          detached: false,
        });

        proc.on('error', (err) => {
          console.error('Failed to start Playwright Codegen:', err.message);
        });

        proc.on('close', (code) => {
          console.log(`\n✅ Playwright Codegen exited (code ${code})\n`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'launched', pid: proc.pid, command: `npx ${args.join(' ')}` }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║   🎭 Playwright Codegen Server             ║`);
  console.log(`║   Running on http://localhost:${PORT}       ║`);
  console.log(`║                                            ║`);
  console.log(`║   Keep this window open & switch to        ║`);
  console.log(`║   the Think Automation Lab browser tab.    ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Stop the other process and retry.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
