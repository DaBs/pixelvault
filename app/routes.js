var path = require('path'),
    utils = require('util'),
    passport = require('passport'),
    request = require('request'),
    async = require('async'),
    urlencode = require('urlencode'),
    SteamStrategy = require('passport-steam').Strategy;




module.exports = function(app) {

  var User = mongoose.model('User'),
      Item = mongoose.model('Item'),
      Offer = mongoose.model('Offer');

  function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
      return next();
    }
    res.sendStatus(401);
  }

  app.get('/auth/steam',
    passport.authenticate('steam', {failureRedirect: '/'}),
    function(req, res) {
      res.redirect('/vault');
    }
  );

  app.get('/auth/steam/return',
    passport.authenticate('steam', {failureRedirect: '/'}),
    function (req, res, next) {
      req.session.cookie.maxAge = 2592000000;
      next();
    },
    function(req, res) {
      res.redirect('/vault');
    }
  );


  app.get('/api/account/history', isLoggedIn, function(req, res) {
    Offer.find({user: req.user[0]._id}).sort('-created').exec(function(err, results) {
      if (err) return res.json(err);
      res.json(results);
    });
  });

  app.get('/api/account/updateBalance', isLoggedIn, function(req, res) {
    Offer.find({user: req.user[0]._id}).populate('items_deposited items_withdrawn').sort('-created').exec(function(err, results) {
      if (err) res.json(err);
      var totalValue = 0;
      for(var i = 0; i < results.length; i++) {
        totalValue += results[i].value;
      }
      User.update({_id: req.user[0]._id}, {total_value: totalValue}, function(err, numAff, rawRes) {
        if (!err) {
          res.json({"success": true, "newValue": totalValue});
        } else {
          res.json({'success': false});
        }
      });
    });
  });

  app.post('/api/steam/getItemPrice', isLoggedIn, function(req, res) {
    var name = JSON.parse(req.body.name);
    var encodedName = urlencode(name);
    request.get('https://steamcommunity.com/market/priceoverview/?country=DK&currency=3&callback=&appid=730&market_hash_name='+encodedName, function(err, httpres, body) {
      if (!err) {
        try {
          var data = JSON.parse(body);
          var newLow = parseFloat(data.lowest_price.substr(0, data.lowest_price.length-1).replace(',', '.'))*100;
          var newMed = parseFloat(data.median_price.substr(0, data.median_price.length-1).replace(',', '.'))*100;
          Item.findOneAndUpdate({market_hash_name: name}, {'price.lowest_price': newLow, 'price.median_price': newMed}, function(err, results) {
            if (err) {
              console.log(err);
            } else {
            }
          })
          res.json({"success": true, "price": data});
        } catch (err) {
          console.log(body);
          console.log(err);
          res.json({"success": false, "err": err});
        }
      } else {
        res.json({"success": false, "err": err});
      }
    });
  })

  app.get('/api/account/steamInventory', isLoggedIn, function(req, res) {
    request.get(req.user[0].profileUrl + 'inventory/json/730/2', function(err, httpres, body) {
      if (err) {
        res.json({success: false});
      } else {
        var resData = JSON.parse(body);
        if (resData.success === true) {
          var newItems = [];
          var rgDescriptions = resData.rgDescriptions;
          var rgInventory = resData.rgInventory;
          for (var k in rgInventory) {
            var rgInvData = rgInventory[k];
            var rawItemData = rgDescriptions[rgInvData.classid + '_' + rgInvData.instanceid];
            if (rawItemData.tradable == 1) {
              var newItem = {
                name: rawItemData.name,
                market_name: rawItemData.market_name,
                market_hash_name: rawItemData.market_hash_name,
                name_color: rawItemData.name_color,
                background_color: rawItemData.background_color,
                icon_url: {
                  normal: rawItemData.icon_url,
                  large: rawItemData.icon_url_large
                },
                price: {
                  lowest_price: 0,
                  volume: "0",
                  median_price: 0
                },
                tradeofferData: {
                  appid: rawItemData.appid,
                  contextid: 2,
                  assetid: rgInvData.id
                }
              };
              if (typeof rawItemData.tags != 'undefined') {
                rawItemData.tags.forEach(function(tag) {
                  if (tag.internal_name.indexOf('Rarity') > -1) {
                    newItem.rarity_color = tag.color
                  }
                });
              };
              (function(item) {
                Item.find({'market_hash_name': item.market_hash_name})
                .exec(function(err, results) {
                  if (!results.length) {
                    var dbItem = new Item({
                      name: item.name,
                      market_name: item.market_name,
                      market_hash_name: item.market_hash_name,
                      name_color: item.name_color,
                      background_color: item.background_color,
                      icon_url: {
                        normal: item.icon_url.normal,
                        large: item.icon_url.large
                      },
                      price: {
                        lowest_price: 0,
                        volume: "0",
                        median_price: 0
                      }
                    });
                    dbItem.save(function(err) {
                      if (err) {
                        console.log(err);
                      }
                    });
                  } else {
                    //console.log(results);
                  };
                })
              })(newItem);
              newItems.push(newItem);
            };
          }
          res.json({"success": true, items: newItems});
        }
      }
    })
  });

  app.get('/api/account', isLoggedIn, function(req, res) {
    User.findById(req.user[0]._id, function(err, user) {
      if (err) res.json(err);
      res.json(user);
    });
  });

  app.get('/api/account/settings', isLoggedIn, function(req, res) {
    console.log(req);
  });

  app.post('/api/account/settings', isLoggedIn, function(req, res) {
    var user = JSON.parse(req.body.user);
    console.log(user);
    User.update({_id: user._id}, {tradeUrl: user.tradeUrl}, function(err, numAff, rawRes) {
      if (!err) {
        console.log(numAff);
        res.json({'success': true});
      } else {
        console.log(err);
        res.json({'success': false});
      }
    })
  });

  app.get('/api/users', function(req, res) {
    User.find(function(err, users) {
      if (err)
        res.json(err);

      res.json(users);
    });
  });

  app.get('/api/users/:id', function(req, res) {
    User.find({_id: req.params.id}, function(err, user) {
      res.json(user);
    })
  });

  app.get('/api/vault', isLoggedIn, function(req,res) {
    Item.find({'tradeLog.in_vault': true},function(err, items) {
      if (err) res.send(err);
      res.json(items);
    });
  });

  app.get('/auth/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/api/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user : '0');
  });

  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '../public', 'views', 'index.html'));
  });

};
