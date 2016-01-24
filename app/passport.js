var passport = require('passport'),
    utils = require('util'),
    SteamStrategy = require('passport-steam').Strategy;


module.exports = function(app, listener) {

  var User = mongoose.model('User');

  passport.serializeUser(function(user, done) {
    done(null, user.steamId);
  });

  passport.deserializeUser(function(id, done) {
    User.find({steamId: id}, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new SteamStrategy({
      returnURL: 'http://localhost/auth/steam/return',
      realm: 'http://localhost/',
      apiKey: 'E0D8A391CCEA24324BC6AB326CD3EC26'
    }, function(identifier, profile, done) {
      var steamUser = new User({
        steamId: profile._json.steamid,
        openId: identifier,
        name: profile._json.personaname,
        admin: false,
        avatar: profile._json.avatar,
        profileUrl: profile._json.profileurl
      });
      User.find({openId: identifier}, function(err, user) {
        if (!err) {
          console.log(user);
          if (user.length < 1) {
            steamUser.save(function(err) {
              if (err) console.log(err);
              return done(null, steamUser);
            });
          } else {
            return done(null, user[0]);
          }

        } else {
          return done(err);
        }
      })


    }
  ));

}
