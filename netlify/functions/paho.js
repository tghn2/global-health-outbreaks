// netlify/functions/paho_no_deps.js
// No-npm-deps Netlify function to proxy PAHO RSS -> JSON
// Drop this into netlify/functions/ and Netlify will deploy it.

const TIMEOUT_MS = 9000;

// naive tag extractor that tolerates attributes and line breaks
function extractTag(text, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(text);
  return m ? m[1].trim() : '';
}

function parseRSSByRegex(xml) {
  const items = [];
  // find item blocks
  const itemRe = /<item[^>]*>([\\s\\S]*?)<\\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractTag(block, 'guid');
    const description = extractTag(block, 'description') || extractTag(block, 'content:encoded') || '';
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date') || '';
    items.push({ title, link, description, pubDate });
  }
  return items;
}

exports.handler = async function (event) {
  const feedUrl = 'https://www.paho.org/en/rss.xml';
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // friendly user-agent helps avoid some bot blocks
    const resp = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'OutbreaksDashboard/1.0 (+https://your-site.example)' }
    });
    clearTimeout(id);

    if (!resp.ok) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Upstream returned ' + resp.status })
      };
    }

    const xml = await resp.text();
    const items = parseRSSByRegex(xml);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // 5 minutes caching on CDN/edge
        'Cache-Control': 'public, max-age=300'
      },
      body: JSON.stringify(items)
    };
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? 'Timeout fetching PAHO RSS' : (err && err.message) || String(err);
    console.error('[paho_no_deps] error', msg);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not fetch PAHO feed', detail: msg })
    };
  }
};
