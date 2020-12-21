'use strict';

var mongoose = require('mongoose'),
    Product = mongoose.model('Product');

exports.get_all_products = async function () {
    return await Product.find({}).exec();
};

exports.update_product = async function (product) {
    return await Product.updateOne({ "ASIN": product.ASIN }, product).exec();
};

exports.add_test_product = () => {
    let new_p = [
        {
            ASIN: "B084DWG2VQ",
            product_url: "https://www.amazon.it/dp/B084DWG2VQ?tag=danieleg-21&linkCode=ogi&th=1&psc=1",
            title: "Nuovo Echo Dot (4ª generazione) - Altoparlante intelligente con Alexa - Antracite",
            brand: "Amazon",
            category: "Electronics",
            description: "Ti presentiamo il nuovo Echo Dot Il nostro altoparlante intelligente con Alexa più venduto. Dal design sobrio e compatto, questo dispositivo offre un suono ricco, con voci nitide e bassi bilanciati.",
            normal_price: 59.99,
            offer_price: 29.99,
            discount_perc: 50,
            imageUrl_large: "https://m.media-amazon.com/images/I/51fsVTWWlPL.jpg",
            imageUrl_medium: "https://m.media-amazon.com/images/I/51fsVTWWlPL._SL160_.jpg",
            isDeal: true
        },
        {
            ASIN: "B08DRPW5RH",
            product_url: "https://www.amazon.it/dp/B08DRPW5RH?tag=danieleg-21&linkCode=ogi&th=1&psc=1",
            title: 'TV LED 28" 28TN515S-WZ Smart TV WiFi DVB-T2 Bianco',
            brand: "LG",
            category: "Electronics",
            description: "Goditi uno Smart TV HD e monitor per PC contemporaneamente con il sintonizzatore DVB-T2/C/S2 integrato",
            normal_price: 199.89,
            offer_price: 199.89,
            discount_perc: 0,
            imageUrl_large: "https://m.media-amazon.com/images/I/51fsVTWWlPL.jpg",
            imageUrl_medium: "https://m.media-amazon.com/images/I/51fsVTWWlPL._SL160_.jpg",
            isDeal: false
        },
        
    ];
    var new_product = new Product(new_p[1]);
    new_product.save((err, product) => {
        if (err)
            console.log(err)
        else console.log(product)
    });
};