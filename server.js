var express         = require('express'),
    session         = require('express-session');
    bodyParser      = require('body-parser'),
    contentFilter   = require('content-filter'),
    methodOverride  = require('method-override'),
    mongoose        = require('mongoose'),
    MongoStore      = require('connect-mongo')(session),
    passport        = require('passport'),
    SteamStrategy   = require('passport-steam').Strategy;


var app = express();

var dbConfig = require('./config/db');

var port = process.env.PORT || 80;

var db = mongoose.connect(dbConfig.url);

var User = require('./app/models/user')(mongoose),
    Item = require('./app/models/item')(mongoose),
    Offer = require('./app/models/offer')(mongoose);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride('X-HTTP-Method-Override'));

app.use(contentFilter());

app.use(session({
  secret: 'pixel pocket pussy',
  store: new MongoStore({
    url: dbConfig.url
  }),
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());

app.use(passport.session());

require('./app/passport')(app);

app.use(express.static(__dirname + '/public'));

require('./app/routes')(app);

var listener = app.listen(port);

console.log('Magic happens on port ' + port);

exports = module.exports = app;
