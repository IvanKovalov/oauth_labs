var request = require("request");

var options = { method: 'POST',
  url: 'https://dev-h3816xplrlj7v6b1.us.auth0.com/oauth/token',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  form:
   { grant_type: 'refresh_token',
     client_id: 'GcgPvUnQPYOW42kSKvgwyuQKchdkuQtE',
     client_secret: 'oS1gVD0U92v-iZD_i4_XNEqMhzp-sGTU2_NdzaZdfgX6rz54mj3phaR8fgBxucZ7-HToB-Cme',
     refresh_token: 'VA'
    }
   };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});