var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SteamMarket = require('steam-market-price');


var itemSchema = new Schema({
  hardData: {
    appid: String,
    contextid: String,
    assetid: String,
    classid: String,
    instanceid: String,
    amount: {type: Number, default: 1},
    missing: Boolean,
    price: {
      lowest_price: {type: String, default: '0'},
      volume: {type: String, default: '0'},
      median_price: {type: String, default: '0'}
    }
  },
  softData: {
    name: String,
    market_name: String,
    market_hash_name: String,
    icon_url: {
      normal: {type: String, default: ''},
      large: {type: String, default: ''}
    }
  }
});

mongoose.connect('mongodb://localhost/pixelvault');
mongoose.connection.on('error', function (err) {
  console.log('mongoose err:', err);
});
mongoose.connection.on("open", function(ref) {
  console.log('connected to mongodb server');
});

var Item = mongoose.model('Item', itemSchema);

var market = new SteamMarket();

market.init({
	profileUrl: 'http://steamcommunity.com/id/thepixelbank'
});

var queryData = {
	classid: '520025252',
	instanceid: '0',
	appid: '730'
}

var full_steamid_other = 'http://steamcommunity.com/id/thepixelbank/inventory/json/730/2';

market.getFullMarketItemData(queryData, function(result) {
    if (result.success === false) {
      callback(result);
    } else {
      var item = result.data;
      console.log(item);
      var testItem = new Item({
        hardData: {
          appid: item.hardData.appid,
          contextid: item.hardData.contextid,
          assetid: item.hardData.assetid,
          classid: item.hardData.classid,
          instanceid: item.hardData.instanceid,
          amount: item.hardData.amount,
          missing: item.hardData.missing,
          price: {
            lowest_price: item.hardData.price.lowest_price,
            volume: item.hardData.price.volume,
            median_price: item.hardData.price.median_price
          }
        },
        softData: {
          name: item.softData.name,
          market_name: item.softData.market_name,
          market_hash_name: item.softData.market_hash_name,
          icon_url: {
            normal: item.softData.icon_url.normal,
            large: item.softData.icon_url.large
          }
        }
      });
      testItem.save(function(err) {
        if (err) console.log(err);
      })
    }
  }, full_steamid_other);
