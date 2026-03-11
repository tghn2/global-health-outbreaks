// netlify/functions/paho.js
// No-npm-deps Netlify function to proxy PAHO RSS -> JSON

const TIMEOUT_MS = 9000;

// Strip HTML tags and decode common HTML entities
function stripHtml(text) {
  return (text || '')
    .replace(/<[^>]*>/g, ' ')          // remove all tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim();
}

// Naive tag extractor that tolerates attributes and line breaks
function extractTag(text, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(text);
  if (!m) return '';
  // unwrap CDATA if present
  const raw = m[1].trim();
  const cdata = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(raw);
  return cdata ? cdata[1].trim() : raw;
}

function parseRSSByRegex(xml) {
  const items = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title       = stripHtml(extractTag(block, 'title'));
    const link        = stripHtml(extractTag(block, 'link') || extractTag(block, 'guid'));
    const description = stripHtml(extractTag(block, 'description') || extractTag(block, 'content:encoded') || '');
    const pubDate     = extractTag(block, 'pubDate') || extractTag(block, 'dc:date') || '';
    items.push({ title, link, description, pubDate });
  }
  return items;
}

exports.handler = async function (event) {
  const feedUrl = 'https://www.paho.org/en/rss.xml';
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
        'Cache-Control': 'public, max-age=300'
      },
      body: JSON.stringify(items)
    };
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? 'Timeout fetching PAHO RSS' : (err && err.message) || String(err);
    console.error('[paho] error', msg);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not fetch PAHO feed', detail: msg })
    };
  }
};
