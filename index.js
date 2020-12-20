const http = require('http');
const Api = require('amazon-pa-api50')
const Config = require('amazon-pa-api50/lib/config');
require('dotenv').config();
require('log-timestamp');
mongoose = require('mongoose');

const resources = require('amazon-pa-api50/lib/options').Resources
const condition = require('amazon-pa-api50/lib/options').Condition
const searchIndex = require('amazon-pa-api50/lib/options').SearchIndex

// Config Amazon API
let myConfig = new Config();
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
  .then(
    () => { console.log('Connected to DB') },
    err => { console.log('ERROR connecting to db: ' + err) }
  );
//db.add_test_product();
db.get_all_products();
// ====== #### =====


const testGetVariations = () => {
  console.log(' ===== getVariations =====')
  const resourceList = resources.getVariationSummary

  api.getVariations("B07QXKW89P", {
    parameters: resourceList,
    condition: condition.Any
  }).then((response) => {
    console.log('data', response.data)
  }, (error) => {
    console.log('Error: ', error)
  })
}

const testSearch = () => {
  console.log(' ===== search result =====')

  let resourceList = resources.getItemInfo
  resourceList = resourceList.concat(resources.getImagesPrimary)

  api.search("Roomba", {
    parameters: resourceList,
    searchIndex: searchIndex.Electronics
  }).then((response) => {
    console.log('data', response.data)
  }, (error) => {
    console.log('Error: ', error)
  })
}

const testGetItemById = () => {
  console.log(' ===== find by Item ids =====')

  let resourceList = resources.getItemInfo
  resourceList = resourceList
    .concat(resources.getImagesPrimary)

  api.getItemById(['B084DWG2VQ'], {
    parameters: resourceList,
    condition: condition.Any
  }).then((response) => {
    console.log("RES: %j", response.data)
  }, (error) => {
    console.log('Error: ', error)
  })
}

//testGetItemById();
//testGetVariations()
//testSearch();
/*setInterval(()=>{
    console.log("Polling executed")
}, 3000);*/