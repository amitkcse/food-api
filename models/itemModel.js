var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var itemModel = new Schema({
   'name': { type: String } ,
   'predictedValue' : { type: Number, min: 1 },
   'createdTillNow' : { type: Number, min: 0, default: 0},
   'openOrder': { type: Number, min : 0, default: 0}
 }, {versionKey: false});
module.exports = mongoose.model('item', itemModel);
