const { put } = require('@vercel/blob');

function readBody(req, limit = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > limit) {
        reject(new Error('File too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = String(req.query.session || '');
  if (!/^[a-f0-9]{24}$/.test(session)) return res.status(400).json({ error: 'Invalid session' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Photo storage is not connected' });
  try {
    const body = await readBody(req);
    if (!body.length) return res.status(400).json({ error: 'Empty file' });
    const image = await put(`mobile-uploads/${session}.jpg`, body, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'image/jpeg'
    });
    await put(`mobile-ready/${session}/${Date.now()}.json`, JSON.stringify({ path: image.url }), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json'
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.message === 'File too large' ? 413 : 500).json({ error: error.message });
  }
};
