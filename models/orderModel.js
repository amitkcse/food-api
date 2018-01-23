var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Item = require('./itemModel.js');

var orderModel = new Schema({
   'itemId' : { type: Schema.Types.ObjectId, ref: Item},
   'itemName': { type: String } ,
   'quantity' : { type: Number, max: 99, min: 1 },
   'status' : { type: String, default: 'open'}
 }, {versionKey: false});
module.exports = mongoose.model('order', orderModel);
