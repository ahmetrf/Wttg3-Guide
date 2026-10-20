const fs = require('node:fs/promises');
const path = require('node:path');

const sitesDirectory = path.join(process.cwd(), 'Sites');

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const folder = typeof request.query.folder === 'string' ? request.query.folder : '';
  if (!/^[a-z0-9]+$/.test(folder)) {
    response.status(400).json({ error: 'Invalid site folder.' });
    return;
  }

  const siteDirectory = path.join(sitesDirectory, folder);
  try {
    const files = await fs.readdir(siteDirectory, { withFileTypes: true });
    const images = files
      .filter((file) => file.isFile() && /\.png$/i.test(file.name))
      .map((file) => file.name)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));

    response.setHeader('Cache-Control', 'no-store');
    response.status(200).json({ images });
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      response.setHeader('Cache-Control', 'no-store');
      response.status(200).json({ images: [] });
      return;
    }

    console.error(`Could not read image folder "${folder}".`, error);
    response.status(500).json({ error: 'Could not read site images.' });
  }
};
