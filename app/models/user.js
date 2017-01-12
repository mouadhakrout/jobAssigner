var moment = require('moment');
// grab the things we need
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
mongoose.Promise = global.Promise;
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var Job = require('./job');
// create a schema
var userSchema = new Schema({
  grade:{type: String,
	  required: false},
  name:{type: String,
	  required: false},
  username:{type: String,
	  required: false},
  password:{type: String,
	  required: true},
  email:{type: String,
	  required: true},
  admin: {type: Boolean,
	  required: false},
 level:{type: String,
	  required: false},
  createdOn:{type: Date,
	  required: false},
  userImage: {type: {},
	  required: false},
  projectTitle:{type: String,
	  required: false},
  jobs: [{ type: Schema.ObjectId, ref: 'Job' }],
  alerts:{type: String,
	  required: false},
  licence:Date,
  isAdmin : Boolean,
  projects: [{ type: Schema.ObjectId, ref: 'Project' }],
  
});

var adminSchema = userSchema.extend({
  
  isMouadhAkrout : Boolean,
  projects: [{ type: ObjectId, ref: 'Admin' }],
});



// custom method to add string to end of name
// you can create more important methods like name validations or formatting
// you can also do queries and find similar users
userSchema.methods.dudify = function() {
  // add some stuff to the users name
  this.name = this.name + '-dude';

  return this.name;
};
//methods ======================
//generating a hash
userSchema.methods.generateHash = function(password) {
 return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking if password is valid
userSchema.methods.validPassword = function(password) {
		

	return bcrypt.compareSync(password, this.password);
};

adminSchema.methods.generateHash = function(password) {
 return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking if password is valid
adminSchema.methods.validPassword = function(admin,password) {

    return bcrypt.compareSync(password, this.password);
};
// the schema is useless so far
// we need to create a model using it
var models = {
    User:mongoose.model('Employe', userSchema),
    Admin : mongoose.model('Admin', adminSchema),
 };
module.exports=models;

