module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var userSchema = new Schema({
    steamId: String,
    openId: String,
    name: String,
    admin: Boolean,
    avatar: String,
    profileUrl: String,
    tradeUrl: {type: String, default: ''},
    deposits: Array,
    withdrawals: Array,
    total_value: {type: Number, default: 0}
  });

  /*userSchema.pre('save', function(next) {
    var self = this;
    User.find({openId: self.openId}, function(err, results) {
      if (!results.length) {
        next();
      } else {
        console.log('user exists: ',self.openId);
        next(new Error('User already exists!'));
      }
    });
  });*/
  var User = mongoose.model('User', userSchema);
  return User;
}
