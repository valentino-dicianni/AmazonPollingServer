const http = require('http');
const Api = require('amazon-pa-api50')
const Config = require('amazon-pa-api50/lib/config');
require('dotenv').config();
require('log-timestamp');
var mongoose = require('mongoose');
var admin = require("firebase-admin");
var serviceAccount = require("./track4deals-firebase-adminsdk-h07o4-64eee604e3.json");
var InfiniteLoop = require('infinite-loop');
const delay = require('delay');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const resources = require('amazon-pa-api50/lib/options').Resources
const Localresources = {
  getOffers: [
    "Offers.Listings.Price",
    "Images.Primary.Medium",
    "Images.Primary.Large",
    'Offers.Summaries.HighestPrice'
  ]
}
const condition = require('amazon-pa-api50/lib/options').Condition
const searchIndex = require('amazon-pa-api50/lib/options').SearchIndex
const country = require('amazon-pa-api50/lib/options').Country

var i, j, temparray, chunk = 10;


// Config Amazon API
let myConfig = new Config(country.Italy);
myConfig.accessKey = process.env.ACCESS_KEY;
myConfig.secretKey = process.env.SECRET_KEY;
myConfig.partnerTag = process.env.PARTNER_TAG;
myConfig.host = 'webservices.amazon.it'; //Amazon Italia
myConfig.region = 'eu-west-1'; // Italy
const api = new Api(myConfig)
// ====== #### =====

// Configure Mongo DB
const Product = require('./models/productModel'); //created model loading here
const Tracking = require('./models/trackingModel'); //created model loading here
const db = require('./dbUtils');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/test', { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    console.log('Connected to DB');

    // ########> INIZIO setInterval <########
    setInterval(() => {
      fetchProducts()
    }, 5000); // Ciclo eseguito ogni n secondi

    // ########> FINE setInterval <########
  },
    err => { console.log('ERROR connecting to db: ' + err) }
  );


const fetchProducts = async function () {
  console.log("Executing Polling to Amazon...")
  let products = await db.get_all_products()
  if (products.length > 0) {
    console.log(`DB: ${products.length} products retrieved...`);
    var i, j, temparray, chunk = 10;
    for (i = 0, j = products.length; i < j; i += chunk) {
      temparray = products.slice(i, i + chunk);
      await updateDB(temparray);
    }
  }
}


/**
 * @param {product} p 
 * Check if product is on offer and update mongoDB
 */
async function updateDB(p) {//TODO: mi sa che bisogna chiederli a gruppi di N prodotti 
  let res = await getProductFromAmazon(p).catch(e => { console.log(e); });
  let items = res.data.ItemsResult.Items;

  for (i in items) {
    let productInfo = items[i];
    if (productInfo.Offers != undefined) { // Prodotto non ha il prezzo o ci sono casini
      if (productInfo.Offers.Listings[0].Price.Savings != undefined) { // Se il prodotto è in offerta
        if (p[i].offer_price != productInfo.Offers.Listings[0].Price.Amount.toFixed(2)) { // Se l'offerta è cambiata
          p[i].normal_price = productInfo.Offers.Listings[0].Price.Amount.toFixed(2) + productInfo.Offers.Listings[0].Price.Savings.Amount.toFixed(2);
          p[i].offer_price = productInfo.Offers.Listings[0].Price.Amount.toFixed(2);
          p[i].discount_perc = productInfo.Offers.Listings[0].Price.Savings.Percentage;
          p[i].isDeal = true;
          db.update_product(p[i]).then((firebaseTokenList) => {
            console.log(`Product ${p[i].ASIN} on offer, updated price from ${p[i].normal_price} to ${p[i].offer_price}...`)
            // Invio notifiche dei prodotti modificati
            sendNotifications(firebaseTokenList)
          });
        } else {
          console.log(`Product ${p[i].ASIN} still on offer...`)
        }
      }
      else { // Se il prodotto non è in offerta
        if (p[i].isDeal) {
          p[i].normal_price = productInfo.Offers.Listings[0].Price.Amount;
          p[i].isDeal = false;
          db.update_product(p[i]).then((res) => {
            console.log(`Product ${p[i].ASIN} not on offer, DB UPDATED...`)
          });
        }
      }
    }
  }
}




/**
 * @param {*} product 
 * Get Info about the product from Amazon server
 */
const getProductFromAmazon = async function (products) {
  let resourceList = resources.getItemInfo
  resourceList = resourceList
    .concat(resources.getItemInfo)
    .concat(Localresources.getOffers)

  let pList = []
  for (p of products) {
    console.log(`Checking product ${p.ASIN} on Amazon...`)
    pList.push(p.ASIN)
  }

  return await api.getItemById(pList, {
    parameters: resourceList,
    condition: condition.New
  });
}



/**
 * Send messages via Firebase to registerd users
 * with new offers 
 */
async function sendNotifications(firebaseTokenList) {
  const registrationTokens = firebaseTokenList;

  const message = {
    data: { message: "Nuove offerte sui tuoi prodotti tracciati" },
    tokens: registrationTokens,
  }

  admin.messaging().sendMulticast(message)
    .then((response) => {
      console.log("FIREBASE: ", response.successCount + ' messages were sent successfully...');
    });
}

