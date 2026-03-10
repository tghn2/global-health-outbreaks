exports.handler = async () => {
  const response = await fetch('https://api.reliefweb.int/v2/reports?appname=tghn-outbreak-monitor-yZfhJK7K73Xr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: { value: "disease epidemic outbreak", operator: "OR" },
      fields: { include: ["title", "url", "date", "body-html"] },
      sort: ["date:desc"],
      limit: 15
    })
  });

  const data = await response.json();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
};
