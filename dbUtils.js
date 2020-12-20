'use strict';

var mongoose = require('mongoose'),
    Product = mongoose.model('Product');

exports.get_all_products = () => {
    Product.find({}, (err, products) => {
        if (err)
            console.log(err)
        else console.log(products)
    });
};

exports.add_test_product = () => {
    let new_p = {
        ASIN: "B084DWG2VQ",
        product_url: "https://www.amazon.it/dp/B084DWG2VQ?tag=danieleg-21&linkCode=ogi&th=1&psc=1",
        title: "Nuovo Echo Dot (4ª generazione) - Altoparlante intelligente con Alexa - Antracite",
        brand: "Amazon",
        description: "Ti presentiamo il nuovo Echo Dot Il nostro altoparlante intelligente con Alexa più venduto. Dal design sobrio e compatto, questo dispositivo offre un suono ricco, con voci nitide e bassi bilanciati.",
        normal_price: 59.99,
        offer_price: 29.99,
        imageUrl_large: "https://m.media-amazon.com/images/I/51fsVTWWlPL.jpg",
        imageUrl_medium: "https://m.media-amazon.com/images/I/51fsVTWWlPL._SL160_.jpg",
        isDeal: true
    }
    var new_product = new Product(new_p);
    new_product.save((err, product) => {
        if (err)
            console.log(err)
        else console.log(product)
    });
};