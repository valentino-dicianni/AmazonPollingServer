'use strict';
var mongoose = require('mongoose');
const productModel = require('./productModel');
var Schema = mongoose.Schema;


var TrackingSchema = new Schema({
    user_id: Number, 
    firebaseToken: String,
    tracking_list : [{
        ASIN: String, 
        product_url: String, 
        title: String,
        brand: String,
        category: String, 
        description: String,    
        normal_price: Number,
        offer_price: Number,
        discount_perc: Number,
        imageUrl_large: String,
        imageUrl_medium: String,
        isDeal: Boolean
    }]
});
module.exports = mongoose.model('Tracking', TrackingSchema);