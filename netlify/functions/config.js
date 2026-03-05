exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supabaseUrl:    process.env.SUPABASE_URL_TOKEN,
      supabaseKey:    process.env.SUPABASE_ANON_KEY_TOKEN,
      adminPassword:  process.env.ADMIN_PASSWORD_TOKEN,
      rss2jsonKey:    process.env.RSS2JSON_KEY_TOKEN
    })
  };
};
