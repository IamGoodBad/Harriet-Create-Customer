const functions = require('firebase-functions');
const admin = require('firebase-admin');
const runtimeVariable = require('./getVariable.js')
const datastore = require('@google-cloud/datastore')();
var stripe

var stripeKey = 'stripeKey'
var firebaseURL = 'firebaseURL'
var deployment = 'garvey-dev'

exports.createCustomer = functions.auth.user().onCreate(event => {

  // if (process.env.NODE_ENV == 'production') {

  // } else {
    
  // }

  console.log(process.env)

  event.body = {}
  event.customer = {}
  event.key = stripeKey
  event.deployment = deployment

  return runtimeVariable.get(event)
  .then(registerStripe)
  .then(registerFirebase)
  .then(createStripeCustomer)
  .then(creatDatastoreRecord)
  .then(function(event) {
  	console.log(event)
  	return Promise.resolve(event)
  })
  .catch(function(error) {
    event.error = error
    admin.database().ref('errors').push().set(event)
    console.error(error);
    return Promise.reject(error)
  })
});

var registerStripe = function(event) {
  stripe = require("stripe")(event[stripeKey])
  return Promise.resolve(event)
}

var registerFirebase = function(event) {
  if (process.env.NODE_ENV == 'production') {
    admin.initializeApp(functions.config().firebase)
    return Promise.resolve(event)
  } else {
    event.key = firebaseURL
    return runtimeVariable.get(event)
    .then(function(event) {
      var serviceAccount = require('./serviceAccount.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: event[firebaseKey]
      });
      return Promise.resolve(event)
    })
  }
}


var createStripeCustomer = function(event) {
	return stripe.customers.create()
	.then(function(customer) {
		event.customer = customer
		return Promise.resolve(event)
	})
    .catch(function(errpr) {
    	return Promise.reject(error)
    })
}

var creatDatastoreRecord = function(event) {
  	return datastore.upsert({
      key: datastore.key(['user', event.data.uid]),
      data: {
        customerID: event.customer.id
      }
    })
    .then(function(datastoreReturn) {
    	event.datastoreReturn = datastoreReturn
    	return Promise.resolve(event)
    })
}
