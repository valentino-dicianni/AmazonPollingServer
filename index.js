const http = require('http');
const Api = require('amazon-pa-api50')
const Config = require('amazon-pa-api50/lib/config');
require('dotenv').config();
require('log-timestamp');
var mongoose = require('mongoose');
var admin = require("firebase-admin");
const delay = require('delay');

admin.initializeApp({
  credential: admin.credential.cert({
    "type": process.env.FIREBASE_TYPE,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
  }),
});


var express = require('express'),
  app = express(),
  port = process.env.PORT || 3001,
  bodyParser = require('body-parser');
app.listen(port);
console.log('track4Deals Polling server API server started on: ' + port);

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
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    console.log('Connected to DB');
    mainLoop()
  },
    err => { console.log('ERROR connecting to db: ' + err) }
  );


const mainLoop = async function () {
  while (true) {
    console.log(" => Starting new update loop <=")
    await fetchProducts()
    await sleep(50000)
  }
}

const fetchProducts = async function () {
  console.log("Executing Polling to Amazon...")
  let products = await db.get_all_products()
  if (products.length > 0) {
    console.log(`DB: ${products.length} products retrieved...`);
    var i, j, temparray, chunk = 10;
    for (i = 0, j = products.length; i < j; i += chunk) {
      temparray = products.slice(i, i + chunk);
      await updateDB(temparray);
      await sleep(1000)
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
        if (p[i].offer_price.toFixed(2) != productInfo.Offers.Listings[0].Price.Amount.toFixed(2)) { // Se l'offerta è cambiata
          p[i].normal_price = productInfo.Offers.Listings[0].Price.Amount.toFixed(2) + productInfo.Offers.Listings[0].Price.Savings.Amount.toFixed(2);
          p[i].offer_price = productInfo.Offers.Listings[0].Price.Amount.toFixed(2);
          p[i].discount_perc = productInfo.Offers.Listings[0].Price.Savings.Percentage;
          p[i].isDeal = true;
          db.update_product(p[i]).then((firebaseTokenList) => {
            console.log(`Product ${p[i].ASIN} on offer, updated price from ${p[i].normal_price} to ${p[i].offer_price}...`)
            // Invio notifiche dei prodotti modificati
            if (firebaseTokenList.length > 0) {
              sendNotifications(firebaseTokenList, p[i])
            }
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
        else {
          console.log(`Product ${p[i].ASIN} remains not on offer...`)
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
    //.concat(resources.getItemInfo)
    .concat(resources.getBrowserNodeInfo)
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
async function sendNotifications(firebaseTokenList, p) {
  const registrationTokens = firebaseTokenList;

  const message = {
    notification: {
      title: 'Nuove offerte sui tuoi prodotti!',
      body: `${p.title} è di nuovo in offerta con il ${p.discount_perc}% di sconto!!`
    },
    tokens: registrationTokens,
  }
  //console.log("Sending Message to: ", firebaseTokenList)

  admin.messaging().sendMulticast(message)
    .then((response) => {
      console.log("FIREBASE: ", response.successCount + ' messages were sent successfully...');
    });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

