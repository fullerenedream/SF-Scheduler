var express = require('express');
var router = express.Router();

router.get('/', function(req,res) {
  var data = req.app.get('appData');
  // console.log(data);
  var installers = data.installers;

  //--> here we tell the view engine which template to render and also pass along data
  // i.e. pageTitle and pageID will be available to template
  res.render('index', // index is the views template to be rendered
  { pageTitle: 'Home',  // the 2nd param to the render call is passing JSON
    pageID: 'home',
    installers: installers // see note on line 14 of app.js re: data
  })
})

module.exports = router;
