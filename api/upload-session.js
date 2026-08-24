const crypto = require('crypto');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const session = crypto.randomBytes(12).toString('hex');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const base = `${proto}://${req.headers.host}`;
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    session,
    uploadUrl: `${base}/mobile-upload.html?session=${session}`,
    qrPath: `/api/qr?session=${session}`
  });
};
