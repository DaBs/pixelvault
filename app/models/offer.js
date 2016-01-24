module.exports = function(mongoose) {
  var Schema = mongoose.Schema;

  var offerSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    items_deposited: [{type: Schema.Types.ObjectId, ref: 'Item'}],
    items_withdrawn: [{type: Schema.Types.ObjectId, ref: 'Item'}],
    created: {type: Date, default: Date.now}
  });

  var Offer = mongoose.model('Offer', offerSchema);
  return Offer;
}
