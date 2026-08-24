const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const QRCode = require('./vendor/qrcode/QRCode');
const QRErrorCorrectLevel = require('./vendor/qrcode/QRCode/QRErrorCorrectLevel');

const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const PORT = Number(process.env.PORT || 8080);
const sessions = new Map();
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function json(res, status, value) {
  send(res, status, JSON.stringify(value));
}

function requestBase(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = String(req.headers.host || '');
  if (/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(host)) {
    const addresses = Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal);
    if (addresses[0]) return `http://${addresses[0].address}:${PORT}`;
  }
  return `${proto}://${host}`;
}

function qrSvg(value) {
  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(value);
  qr.make();
  const quiet = 4;
  const count = qr.getModuleCount();
  const size = count + quiet * 2;
  const cells = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) cells.push(`<rect x="${col + quiet}" y="${row + quiet}" width="1" height="1"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#171717">${cells.join('')}</g></svg>`;
}

function serveFile(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

function receiveUpload(req, res, session) {
  if (!/^[a-f0-9]{24}$/.test(session) || !sessions.has(session)) return json(res, 404, { error: 'Invalid or expired session' });
  const contentType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
  const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif' };
  const extension = extensions[contentType];
  if (!extension) return json(res, 415, { error: 'Image file required' });

  const chunks = [];
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > 15 * 1024 * 1024) req.destroy();
    else chunks.push(chunk);
  });
  req.on('end', () => {
    if (!size || size > 15 * 1024 * 1024) return json(res, 413, { error: 'Image must be 15MB or smaller' });
    const filename = `${session}${extension}`;
    fs.writeFile(path.join(UPLOAD_DIR, filename), Buffer.concat(chunks), error => {
      if (error) return json(res, 500, { error: 'Upload failed' });
      const publicPath = `/uploads/${filename}`;
      sessions.set(session, { ready: true, path: publicPath, receivedAt: Date.now() });
      json(res, 200, { ok: true, path: publicPath });
    });
  });
  req.on('error', () => {
    if (!res.headersSent) json(res, 400, { error: 'Upload interrupted' });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, requestBase(req));
  if (req.method === 'GET' && url.pathname === '/api/upload-session') {
    const session = crypto.randomBytes(12).toString('hex');
    sessions.set(session, { ready: false, createdAt: Date.now() });
    return json(res, 200, {
      session,
      uploadUrl: `${requestBase(req)}/mobile-upload.html?session=${session}`,
      qrPath: `/api/qr?session=${session}`
    });
  }
  if (req.method === 'GET' && url.pathname === '/api/qr') {
    const session = url.searchParams.get('session') || '';
    if (!sessions.has(session)) return send(res, 404, 'Invalid session', 'text/plain');
    const uploadUrl = `${requestBase(req)}/mobile-upload.html?session=${session}`;
    return send(res, 200, qrSvg(uploadUrl), 'image/svg+xml; charset=utf-8');
  }
  if (req.method === 'GET' && url.pathname === '/api/mobile-upload/status') {
    const session = url.searchParams.get('session') || '';
    const status = sessions.get(session);
    return status ? json(res, 200, status) : json(res, 404, { ready: false });
  }
  if (req.method === 'POST' && url.pathname === '/api/mobile-upload') {
    return receiveUpload(req, res, url.searchParams.get('session') || '');
  }
  serveFile(req, res, decodeURIComponent(url.pathname));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`KODAK AI FILM LAB running on http://0.0.0.0:${PORT}`);
});
