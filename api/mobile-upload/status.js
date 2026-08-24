const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const session = String(req.query.session || '');
  if (!/^[a-f0-9]{24}$/.test(session)) return res.status(400).json({ error: 'Invalid session' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ ready: false });
  try {
    const result = await list({ prefix: `mobile-ready/${session}/`, limit: 1 });
    if (!result.blobs.length) return res.status(200).json({ ready: false });
    const marker = await fetch(result.blobs[0].url, { cache: 'no-store' }).then(response => response.json());
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ready: true, path: marker.path });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
