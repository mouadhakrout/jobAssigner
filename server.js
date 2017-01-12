// server.js
// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var promise = require('promise'); 
var port     = process.env.PORT || 8000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var nodemailer = require('nodemailer');
var momentTimeZone = require('moment-timezone');
var moment = require('moment');
var http = require('http');
var fs=require('fs');
var path = require('path');
// all environments
var multer = require('multer');
var transporter = nodemailer.createTransport('smtps://mouadhakrout@gmail.com:mouadhweldmabrouka@smtp.gmail.com');
var configDB = require('./config/database.js');
// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
require('./config/passport')(passport); // pass passport for configuration
app.configure(function() {

	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms

	app.set('view engine', 'ejs'); // set up ejs for templating

	// required for passport
	app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session

});
app.set('views', __dirname + '/public/views');
app.use('/libs', express.static(__dirname + '/public/libs'));
app.use('/style', express.static(__dirname + '/public/views/style'));
app.use('/images', express.static(__dirname + '/public/views/images'));
app.use('/assets', express.static(__dirname + '/public/views/assets'));
app.engine('html', require('ejs').renderFile);
// if our user.js file is at app/models/user.js
app.use('/controllers', express.static(__dirname + '/public/controllers'));
app.use('/uploads', express.static(__dirname + '/public/views/uploads'));
app.use('/node_modules',express.static(__dirname + '/node_modules'));
app.use('/bower_components',express.static(__dirname + '/bower_components'));
//var User = require('./app/models/user').User;
//var Admin = require('./app/models/user').Admin;
app.use(express.bodyParser({uploadDir:'./uploads/'}));
// routes ======================================================================
require('./app/routes.js')(app,passport,multer,mongoose,flash,nodemailer,momentTimeZone,moment,http,fs,path,transporter,promise); // load our routes and pass in our app and fully configured passport
// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
