var moment = require('moment');
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
var User = require('./user');
// create a schema
var jobSchema = new Schema({
	projectTitle:String,
    title: String,
    detail:String,
    employe: { type: Schema.ObjectId, ref: 'Employe' },
    beginOn:Date,
    finishOn:Date,
	jobStatus:String,
	alertWorker:Boolean
});

var Job = mongoose.model('Job', jobSchema);

// make this available to our users in our Node applications
module.exports = Job;

