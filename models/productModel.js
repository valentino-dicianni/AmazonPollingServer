'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ProductSchema = new Schema({
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
});
module.exports = mongoose.model('Product', ProductSchema);