var ROUTES = {
  HTTP_PORT: 3000,
  HTTPS_PORT: 3001,
  INSTRUMENT: "/instrument",
  BEAUTIFY_JS: "/beautifyJS",
  BEAUTIFY_HTML: "/beautifyHTML"
};

ROUTES.HOST = "https://localhost:" + ROUTES.HTTPS_PORT;

module.exports = ROUTES;