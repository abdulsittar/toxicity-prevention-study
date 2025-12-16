// Simple user-space reverse proxy for Socket.IO (HTTP + WebSocket)
// For testing when you can't edit Apache config. Forwards to http://127.0.0.1:8080
// Usage:
//   npm install http-proxy
//   node proxy.js       # listens on port 8081 by default
// Or set PROXY_PORT env var to change the listening port.

const http = require('http');
const httpProxy = require('http-proxy');

const TARGET = process.env.TARGET || 'http://127.0.0.1:8080';
const PORT = Number(process.env.PROXY_PORT || 8081);

const proxy = httpProxy.createProxyServer({ target: TARGET, ws: true, changeOrigin: true });

proxy.on('error', (err, req, res) => {
  console.error('Proxy error', err);
  try {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    res.end('Bad gateway. Proxy error.');
  } catch (e) {
    // ignore
  }
});

const server = http.createServer((req, res) => {
  // Forward regular HTTP requests to the target (Engine.IO polling will use this)
  proxy.web(req, res, { target: TARGET });
});

// Handle websocket upgrade requests and forward them to the target
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target: TARGET });
});

server.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT} -> ${TARGET}`);
  console.log('To change listening port set PROXY_PORT, to change target set TARGET');
});
