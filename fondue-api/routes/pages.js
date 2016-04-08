module.exports = function(app){
  var home = function(req, res){
    res.send("<html><body><h3>Fondue API</h3></body></html>")
  };

  app.get("/", home);
  app.get("/index", home);
};

