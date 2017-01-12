var moment = require('moment');
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Project = require('./project');
// create a schema
var projectSchema = new Schema({
  owner:[{ type: Schema.ObjectId, ref: 'Employe' }],
  title:{type: String,
  required: true},
  description:{type: String,
	  required: true},
  equipe: [{ type:Schema.ObjectId, ref: 'Employe' }],

});

// the schema is useless so far
// we need to create a model using it
var Project = mongoose.model('Project', projectSchema);

// make this available to our users in our Node applications
module.exports = Project;