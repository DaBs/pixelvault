module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var inventorySchema = new Schema({
    steamId: String,
    items: [{type: Schema.Types.ObjectId, ref: 'Item'}],
    last_updated: {type: Date, default: Date.now}
  });
  var Inventory = mongoose.model('Inventory', inventorySchema);
  return Inventory;
}
