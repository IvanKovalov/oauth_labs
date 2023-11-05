var request = require("request");

var options = { method: 'POST',
  url: 'https://dev-h3816xplrlj7v6b1.us.auth0.com/oauth/token',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  form:
   { client_id: 'OkOsutjgZ95AYPfqzUJiqCZ37JAgdLay',
     client_secret: '${cl_secret}',
     audience: 'https://dev-h3816xplrlj7v6b1.us.auth0.com/api/v2/',
     grant_type: 'client_credentials' }
   };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
