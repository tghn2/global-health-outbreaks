exports.handler = async () => {
  const response = await fetch('https://api.reliefweb.int/v2/reports?appname=rwint-user-0&profile=list&preset=latest&slim=1&query%5Bvalue%5D=disease+epidemic+outbreak&query%5Boperator%5D=OR', {
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
