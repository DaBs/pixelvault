var fs = require('fs');
var crypto = require('crypto');
var request = require('request');
var winston = require('winston');
var q = require('q');
var async = require('async');
var retry = require('retry');
var mongoose = require('mongoose');
var crypto = require('crypto');
var app = require('http').createServer();
var io = require('socket.io')(app);



var Steam = require('steam');
var SteamWebLogOn = require('steam-weblogon');
var getSteamAPIKey = require('steam-web-api-key');
var SteamTradeOffers = require('steam-tradeoffers'); // change to 'steam-tradeoffers' if not running from the examples subdirectory
var SteamMarketPrice = require('steam-market-price');


var admin = '76561198026936299'; // put your steamid here so the bot can accept your offers

var logOnOptions = {
  account_name: 'thepixelbank',
  password: 'redacted'
};

var authCode = '5P65P'; // code received by email

try {
  logOnOptions['sha_sentryfile'] = getSHA1(fs.readFileSync('sentry'));
} catch (e) {
  if (authCode != '') {
    logOnOptions['auth_code'] = authCode;
  }
}

// if we've saved a server list, use it
if (fs.existsSync('servers')) {
  //Steam.servers = JSON.parse(fs.readFileSync('servers'));
}
var steamMarket = new SteamMarketPrice();
var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);
var steamFriends = new Steam.SteamFriends(steamClient);
var steamWebLogOn = new SteamWebLogOn(steamClient, steamUser);
var offers = new SteamTradeOffers();

steamMarket.init({
  profileUrl: 'http://steamcommunity.com/id/thepixelbank',
  currency: 3,
  country: 'DK'
});

app.listen(3000);

mongoose.connect(require('../config/db').url);
var Item = require('../app/models/item')(mongoose),
    Offer = require('../app/models/offer')(mongoose),
    User = require('../app/models/user')(mongoose),
    Inventory = require('../app/models/inventory')(mongoose);
mongoose.connection.on('error', function (err) {
  console.log('mongoose err:', err);
});
mongoose.connection.on("open", function(ref) {
  console.log('connected to mongodb server');
});

steamClient.connect();
steamClient.on('connected', function() {
  steamUser.logOn(logOnOptions);
});

steamClient.on('logOnResponse', function(logonResp) {
  if (logonResp.eresult == Steam.EResult.OK) {
    console.log('Logged in!');
    steamFriends.setPersonaState(Steam.EPersonaState.Online);

    steamWebLogOn.webLogOn(function(sessionID, newCookie){
      getSteamAPIKey({
        sessionID: sessionID,
        webCookie: newCookie
      }, function(err, APIKey) {
        offers.setup({
          sessionID: sessionID,
          webCookie: newCookie,
          APIKey: APIKey
        });
        //getTradeOffers();
      });
    });
  }
});

steamClient.on('servers', function(servers) {
  fs.writeFile('servers', JSON.stringify(servers));
});

steamUser.on('updateMachineAuth', function(sentry, callback) {
  fs.writeFileSync('sentry', sentry.bytes);
  callback({ sha_file: getSHA1(sentry.bytes) });
});

var connections = {};


io.on('connection', function(socket) {
  socket.emit('connected', {success: true});
  console.log(socket.id);
  connections[socket.id] = {};
  connections[socket.id].acceptedTrade = false;
  socket.on('startTradeOffer', function(data) {
    var tradeSecret = crypto.randomBytes(20).toString('hex');
    connections[socket.id].tradeSecret = tradeSecret;
    var date = new Date();
    var dateFormatted = ("0" + date.getHours()).slice(-2) + ':' + ("0" + date.getMinutes()).slice(-2) + ':' + ("0" + date.getSeconds()).slice(-2);
    setTimeout(function() {
      socket.emit('msg', {time: dateFormatted, message: 'zZzzZz.. Huh? Oh, I\'m awake now. Starting tradeoffer', side: 'left', img: '/img/tinyrobo.png'});

      var tradeOfferOperation = retry.operation({
        retries: 3,
        factor: 1,
        minTimeout: 5 * 1000,
        maxTimeout: 5 * 1000,
        randomize: false
      });

      tradeOfferOperation.attempt(function(currentAttempt) {
        offers.makeOffer({
          partnerSteamId: data.steamId,
          itemsFromMe: [],
          itemsFromThem: data.items_to_receive,
          message: 'Safety tradeoffer ID: ' + tradeSecret
        }, function(err, response) {
          var date = new Date();
          var dateFormatted = ("0" + date.getHours()).slice(-2) + ':' + ("0" + date.getMinutes()).slice(-2) + ':' + ("0" + date.getSeconds()).slice(-2);
          if (tradeOfferOperation.retry(err)) {
            console.log(err);
            var retries = (4-currentAttempt) + ' retries left.';
            if (4-currentAttempt === 1) {
              retries = 'Last retry.';
            }
            socket.emit('msg', {time: dateFormatted, message: 'I couldn\'t create the tradeoffer... I\'ll retry in 5 seconds. ' + retries, side: 'left', img: '/img/tinyrobo.png'});
            return;
          }

          if (err) {
            console.log(err);
            console.log(response);
            socket.emit('msg', {time: dateFormatted, message: 'Eh, I tried trading 3 times, but none went through. Maybe Steam is down, or maybe you can\'t trade? Anyway, I\'m sorry :(', side: 'left', img: '/img/tinyrobo.png'});
            setTimeout(function() {
              socket.emit('done', {success: false, err: err, res: response});
            }, 5000);
          } else {
            socket.emit('done', {success: true, uid: tradeSecret, res: response});
            connections[socket.id].tradeOfferId = response.tradeofferid;
            var attempts = 0;
            connections[socket.id].checkOffer = setInterval(function() {
              offers.getOffer({
                tradeofferid: response.tradeofferid,
                language: 'english'
              }, function(err, res) {
                if (!err) {
                  var offer = res.response.offer;
                  connections[socket.id].descriptions = connections[socket.id].descriptions || res.response.descriptions;
                  console.log(res);
                  socket.emit('offerStatus', {status: offer.trade_offer_state});
                  if(offer.trade_offer_state === 2) {
                    //console.log(res.response.descriptions);
                  };
                  if (offer.trade_offer_state === 3) {
                    clearInterval(connections[socket.id].checkOffer);
                    var itemCalls = [];
                    connections[socket.id].descriptions.forEach(function(item) {
                      itemCalls.push(function(callback) {
                        Item.findOne({market_hash_name: item.market_hash_name}, function(err, result) {
                          if (!err) {
                            callback(null, result._id);
                          } else {
                            callback(err);
                          }
                        });
                      });
                    });
                    async.parallel(itemCalls, function(err, results) {
                      var dbItemsDeposited = [];
                      console.log(results);
                      results.forEach(function(item) {
                        dbItemsDeposited.push(item._id);
                      });
                      User.findOne({'steamId': offer.steamid_other}, function(err, result) {
                        if (!err) {
                          var dbOffer = new Offer({
                            user: result._id,
                            items_deposited: dbItemsDeposited,
                            items_withdrawn: []
                          });
                          dbOffer.save(function(err, res) {
                            if (err) console.log(err);
                          });
                        };
                      });
                    });
                  };
                } else {
                  console.log(err);
                }
              });
            }, 3000);
          }

        });
      });

    }, 1000);
  });
  socket.on('disconnect', function() {
    console.log(connections[socket.id]);
    if (!connections[socket.id].acceptedTrade && typeof connections[socket.id].tradeOfferId !== 'undefined') {
      clearInterval(connections[socket.id].checkOffer);
      offers.cancelOffer({tradeOfferId: connections[socket.id].tradeOfferId}, function(response) {
        console.log(response);
      });
      console.log('cancelled offer');
    }
    delete connections[socket.id]
    console.log('site disconnected');
  });
});

var getTradeOffers = function() {
  offers.getOffers({
    get_received_offers: 1,
    active_only: 1,
    time_historical_cutoff: Math.round(Date.now() / 1000)
  }, function(error, body) {
    if (error) throw (error);
    if(body.response.trade_offers_received){
      body.response.trade_offers_received.forEach(function(offer) {
        if (offer.trade_offer_state == 2){
          //console.log(offer);
          //console.log(offer.items_to_give);
          if (typeof offer.items_to_give === 'undefined') {

            //console.log(offer);
            //winston.log(offer);
            async.filter(['http://steamcommunity.com/profiles/'+offer.steamid_other, 'http://steamcommunity.com/id/'+offer.steamid_other], function(item, callback) {
              request(item+'/inventory/json/'+offer.items_to_receive[0].appid+'/2/', function(err, res, body) {
                if (!err) {
                  try {
                    var json = JSON.parse(body);
                  }
                  catch(e) {
                    return callback(false);
                  }
                  return callback(true);
                } else {
                  callback(false);
                }
              });
            }, function(results) {
              var full_steamid_other = results[0];
              var itemCalls = [];
              offer.items_to_receive.forEach(function(item){
                itemCalls.push(function(callback) {
                  steamMarket.getFullMarketItemData(item, function(data) {
                    if (data.success === false) {
                      callback(data);
                    } else {
                      callback(null, data);
                    }
                  }, full_steamid_other);
                });
              });

              async.parallel(itemCalls, function(err, results) {
                if (err) return console.log(err);
                var collectiveValue = 0;
                var dbDepositedItems = [];
                for (var i = 0; i < results.length; i++) {
                  var result = results[i];
                  var item = result.data;
                  var itemValue = parseFloat(item.hardData.price.median_price.replace(',', '.'))*100;
                  var dbItem = new Item().fillDataFromItem(item);
                  dbItem.save(function(err) {
                    console.log('saved item');
                    if (err) console.log(err);
                  });
                  dbDepositedItems.push(dbItem._id);
                  offer.items_to_receive[i].value = itemValue;
                  collectiveValue += itemValue;
                }

                User.findOne({steamId: offer.steamid_other}, function(err, user) {
                  if (err) return console.log(err);
                  if (user) {
                    var dbOffer = new Offer({
                      user: user._id,
                      value: collectiveValue,
                      items_deposited: dbDepositedItems,
                      items_withdrawn: []
                    });
                    var newValue = user.total_value += collectiveValue;
                    User.update({_id: user._id}, {total_value: newValue}, function(err, numAff, rawRes) {
                      if (err) console.log(err);
                    });
                    dbOffer.save(function(err) {
                      if (err) console.log(err);
                      console.log('saved offer: ',dbOffer);
                    });
                  };
                });
                offers.acceptOffer({tradeOfferId: offer.tradeofferid});
                console.log('Accepted offer ', offer.tradeofferid);
                winston.log('Accepted offer ' + offer.tradeofferid);
              });
            });



            /*for (var i = 0; i < offer.items_to_receive.length; i++) {
              var item = offer.items_to_receive[i];

              steamMarket.getMarketItem(item, function(data) {

              });
              console.log('Item price is: ', itemPrice);

            };*/


          } else if (offer.steamid_other == admin) {
            offers.acceptOffer({tradeOfferId: offer.tradeofferid});

            console.log('Accepted offer ', offer.tradeofferid);
            winston.log('Accepted offer ' + offer.tradeofferid);

          } else {
            offers.declineOffer({tradeOfferId: offer.tradeofferid});
            console.log('Rejected offer ', offer.tradeofferid, offer);
            winston.log('Rejected offer ' + offer.tradeofferid);
          }
          /*//offers.declineOffer({tradeOfferId: offer.tradeofferid});
          if(offer.steamid_other == admin) {
            offers.acceptOffer({tradeOfferId: offer.tradeofferid});
          } else {
            offers.declineOffer({tradeOfferId: offer.tradeofferid});
          }*/
        }
      });
    }
  });
}

steamUser.on('tradeOffers', function(number) {
  if (number > 0) {
    getTradeOffers();
  }
});

function getSHA1(bytes) {
  var shasum = crypto.createHash('sha1');
  shasum.end(bytes);
  return shasum.read();
}
