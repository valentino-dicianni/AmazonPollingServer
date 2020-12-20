'use strict';
var mongoose = require('mongoose');
const productModel = require('./productModel');
var Schema = mongoose.Schema;


var TrackingSchema = new Schema({
    user_id: Number, 
    tracking_list : [productModel]
});
module.exports = mongoose.model('Tracking', TrackingSchema);