module.exports = function (req, res, next) {
  res.setHeader("origin", req.headers.origin);
  res.setHeader("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

  //res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};