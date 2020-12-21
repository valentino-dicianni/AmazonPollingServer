const http = require('http');
const Api = require('amazon-pa-api50')
const Config = require('amazon-pa-api50/lib/config');
require('dotenv').config();
require('log-timestamp');
mongoose = require('mongoose');

const resources = require('amazon-pa-api50/lib/options').Resources
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
const db = require('./dbUtils');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/test', { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    console.log('Connected to DB');
    //db.add_test_product();
    // ########> INIZIO setInterval <########
    setInterval(() => {
      console.log("Executing Polling to Amazon...")
      db.get_all_products().then((products) => {
        if (products.length > 0) {
          console.log(`DB: ${products.length} products retrieved...`);
          for (p of products) {
            updateDB(p);
          }
        }
      });
    }, 15000); // Ciclo eseguito ogni n secondi
    // ########> FINE setInterval <########

  },
    err => { console.log('ERROR connecting to db: ' + err) }
  );


async function updateDB(p) {//TODO: mi sa che bisogna chiederli a gruppi di N prodotti 
  let res = await getProductFromAmazon(p);
  productInfo = res.data.ItemsResult.Items[0];

  //console.log(productInfo.Offers.Listings[0].Price);
  //TODO: qui bisogna controllare se prima non era in offerta e mandare la notifica in caso positivo
  if (productInfo.Offers.Listings[0].Price.Savings != undefined) { // Se il prodotto è in offerta
    if (p.offer_price != productInfo.Offers.Listings[0].Price.Amount.toFixed(2)) { // Se l'offerta è cambiata
      p.normal_price = productInfo.Offers.Listings[0].Price.Amount.toFixed(2) + productInfo.Offers.Listings[0].Price.Savings.Amount.toFixed(2);
      p.offer_price = productInfo.Offers.Listings[0].Price.Amount.toFixed(2);
      p.discount_perc = productInfo.Offers.Listings[0].Price.Savings.Percentage;
      p.isDeal = true;
      db.update_product(p).then((res) => {
        console.log(`Product ${p.ASIN} on offer, updated price from ${p.normal_price} to ${p.offer_price}...`)
      });
    } else {
      console.log(`Product ${p.ASIN} still on offer...`)
    }
  }
  else { // Se il prodotto non è in offerta
    p.normal_price = productInfo.Offers.Listings[0].Price.Amount;
    p.isDeal = false;
    db.update_product(p).then((res) => {
      console.log(`Product ${p.ASIN} not on offer, DB UPDATED...`)
    });
  }
}

const testGetVariations = () => {
  console.log(' ===== getVariations =====')
  const resourceList = resources.getOffers

  api.getVariations("B07B4F8WC6", {
    parameters: resourceList,
    condition: condition.Any
  }).then((response) => {
    console.log("RES: %j", response.data)
  }, (error) => {
    console.log('Error: ', error)
  })
}

const testSearch = () => {
  console.log(' ===== search result =====')

  let resourceList = resources.getItemInfo
  resourceList = resourceList.concat(resources.getImagesPrimary)

  api.search("tv lg", {
    parameters: resourceList,
    searchIndex: searchIndex.Electronics
  }).then((response) => {
    console.log("RES: %j", response.data)
  }, (error) => {
    console.log('Error: ', error)
  })
}

const getProductFromAmazon = async function (product) {
  console.log(`Checking product ${product.ASIN} on Amazon...`)
  let resourceList = resources.getItemInfo
  resourceList = resourceList
    .concat(resources.getItemInfo)
    .concat(resources.getOffers)

  return await api.getItemById([product.ASIN], {
    parameters: resourceList,
    condition: condition.New
  });
}

//testGetItemById();
//testGetVariations()
//testSearch();
