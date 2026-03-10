// netlify/functions/paho.js
const Parser = require('rss-parser');
const parser = new Parser();
const TIMEOUT_MS = 9000;

exports.handler = async function(event) {
  const feedUrl = 'https://www.paho.org/en/rss.xml';
  try {
    const parsed = await Promise.race([
      parser.parseURL(feedUrl),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout fetching PAHO RSS')), TIMEOUT_MS))
    ]);

    const items = (parsed.items || []).map(it => ({
      title: it.title || '',
      link: it.link || it.guid || '',
      description: it.content || it.contentSnippet || it.description || '',
      pubDate: it.pubDate || it.isoDate || null
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // edge-cache in Netlify: client should still set caching on the UI if needed
        'Cache-Control': 'public, max-age=300'
      },
      body: JSON.stringify(items)
    };
  } catch (err) {
    console.error('[paho function] error', err && err.stack || err);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not fetch PAHO feed', detail: err?.message })
    };
  }
};
