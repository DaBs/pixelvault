module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var itemSchema = new Schema({
    name: String,
    market_name: String,
    market_hash_name: String,
    name_color: String,
    background_color: String,
    rarity_color: String,
    icon_url: {
      normal: String,
      large: String
    },
    price: {
      lowest_price: {type: Number, default: 0},
      volume: String,
      median_price: {type: Number, default: 0}
    }
  });

  var Item = mongoose.model('Item', itemSchema);
  return Item;
}
