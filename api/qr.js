const QRCode = require('../vendor/qrcode/QRCode');
const QRErrorCorrectLevel = require('../vendor/qrcode/QRCode/QRErrorCorrectLevel');

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

module.exports = function handler(req, res) {
  const session = String(req.query.session || '');
  if (!/^[a-f0-9]{24}$/.test(session)) return res.status(400).send('Invalid session');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const url = `${proto}://${req.headers.host}/mobile-upload.html?session=${session}`;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(qrSvg(url));
};
