exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supabaseUrl:    process.env.SUPABASE_URL,
      supabaseKey:    process.env.SUPABASE_ANON_KEY,
      adminPassword:  process.env.ADMIN_PASSWORD,
      rss2jsonKey:    process.env.RSS2JSON_KEY
    })
  };
};
