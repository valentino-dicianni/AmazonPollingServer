'use strict';

var mongoose = require('mongoose'),
    Product = mongoose.model('Product'),
    Tracking = mongoose.model('Tracking');

exports.get_all_products = async function () {
    return await Product.find({}).exec();
};

async function get_allFirebaseToken(product) {
    let res = await Tracking.find({ "tracking_list.ASIN": product.ASIN }, { firebaseToken: 1 });
    //console.log("TOKENS: ", res);
    return res;
}

/**
 * @param {*} product 
 * Update of Product collection and Tracking collection for every user involved.
 * Returns a list of firebaseToken to send notifications to
 */
exports.update_product = async function (product) {
    let result = await Product.updateOne({ "ASIN": product.ASIN }, product).exec();
    if (result.ok != 1)
        console.log(`ERROR: Product ${p.ASIN} error updating database Product...`)
    const updateDocument = {
        $set: {
            "tracking_list.$[orderElem].normal_price": product.normal_price,
            "tracking_list.$[orderElem].offer_price": product.offer_price,
            "tracking_list.$[orderElem].discount_perc": product.discount_perc,
            "tracking_list.$[orderElem].isDeal": product.isDeal,
        }
    };
    const options = {
        arrayFilters: [{
            "orderElem.ASIN": product.ASIN
        }]
    };
    result = await Tracking.updateMany({}, updateDocument, options);

    if (result.ok != 1)
        console.log(`ERROR: Product ${p.ASIN} error updating database Tracking...`)
    if (result.ok == 1) {return (await get_allFirebaseToken(product)).map(x => x.firebaseToken) }
    else return [];
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

exports.add_test_tracking = () => {
    let new_p =
    {
        user_id: "124412324",
        firebaseToken: "sfkehlfishgoihgoi12332r",
        tracking_list: [{
            ASIN: "B084DWG2VQ",
            product_url: "https://www.amazon.it/dp/B084DWG2VQ?tag=danieleg-21&linkCode=ogi&th=1&psc=1",
            title: "Nuovo Echo Dot (4ª generazione) - Altoparlante intelligente con Alexa - Antracite",
            brand: "Amazon",
            category: "Electronics",
            description: "Ti presentiamo il nuovo Echo Dot Il nostro altoparlante intelligente con Alexa più venduto. Dal design sobrio e compatto, questo dispositivo offre un suono ricco, con voci nitide e bassi bilanciati.",
            normal_price: 59.99,
            offer_price: 59,
            discount_perc: 50,
            imageUrl_large: "https://m.media-amazon.com/images/I/51fsVTWWlPL.jpg",
            imageUrl_medium: "https://m.media-amazon.com/images/I/51fsVTWWlPL._SL160_.jpg",
            isDeal: false
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
        }]
    };

    var new_tracking = new Tracking(new_p);
    new_tracking.save((err, product) => {
        if (err)
            console.log(err)
        else console.log(product)
    });
};