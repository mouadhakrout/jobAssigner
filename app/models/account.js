var moment = require('moment');
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Account = require('./account');
// create a schema
var accountSchema = new Schema({
  email:String,
  password:String
});



// the schema is useless so far
// we need to create a model using it
var Account = mongoose.model('Account', accountSchema);

// make this available to our users in our Node applications
module.exports =Account;