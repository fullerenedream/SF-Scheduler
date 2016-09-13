//define express, reload, app
var express = require('express');
var app = express();
var reload = require('reload');
var process = require('process');

app.set('port', process.env.PORT || 3000);
app.set('view engine','ejs');
app.set('views','app/views');

//--> example of loading a json file and storing as an app var
//--> app vars will be available to routes with req.app.get('appData')
var dataFile = require('./data/data.json');

app.set('appData',dataFile);
// so if we have a JSON file of just the installers, with their name and ID
// within a .ejs file, we could load the contents of the JSON file into a var
// with e.g.   var mydata = req.app.get('appData')
// then in the .ejs file you could iterate that and output properties of it
// i.e. mydata.installers.each(key, item) {
//  #{item.name}
// }

//--> app.locals.anyVar is available to all of your views as anyVar
app.locals.siteTitle = 'Swift Fox Calendar';
// so if we're in a .ejs file, we can call siteTitle like so:
// #{siteTitle}
// and that would yield 'My Awesome App'

//--> tell express where to find static files
app.use(express.static('app/public'));
// then everything in /public is accessible

//--> tell app to load routes
app.use(require('./routes/index.js'));
app.use(require('./routes/api.js'));
// these are loading corresponding .js files
// the .js is optional, but I like to make it clear they're FILES


// good morning, server!
var server = app.listen(app.get('port'), function(){
  console.log('listening on ' + app.get('port'));
});
// automatically refresh & reload code in browser when code changes
reload(server, app);


process.on('SIGUSR2', function() {
  // console.log('Killed via SIGUSR2');
  // Graceful cleanup & shutdown
  process.exit(0); // Exit successfully
});
