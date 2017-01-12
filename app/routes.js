// app/routes.js
module.exports = function(app,passport,multer,mongoose,flash,nodemailer,momentTimeZone,moment,http,fs,path,transporter,promise) {	
	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	
	app.get('/newProject', function(req, res) {
		res.render('newproject.html'); 
	});
	app.get('/addWorker',function(req, res) {
		res.render('addworker.html'); 
	});
	app.get('/projectsList', function(req, res) {
		res.render('projects.html'); 
	});
	app.get('/usersList', function(req, res) {
		
		res.render('users.html'); 
	});
	app.get('/userJobs', function(req, res) {
		
		res.render('JobsByUser.html'); 
	});
	app.get('/workersToAlert', function(req, res) {
		
		res.render('workersToAlert.html'); 
	});	
	
	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	
	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	
	app.get('/profile', isLoggedIn, valideLicence,function(req, res) {
			if(req.user.email=='mouadhakrout@gmail.com'){
							req.user.username='Manager';
						}
		res.render('profile.ejs', {
			
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		
		req.logout();
		res.redirect('/');
	});

	// Logics ==============================
	
	var User = require('../app/models/user').User;
	var Admin = require('../app/models/user').Admin;
	var Job = require('../app/models/job');
	var Account = require('../app/models/account');
	var Project = require('../app/models/project');
	
		function fetchTeam(projectID){
		return new Promise(function(resolve, reject){

				Project
				.findOne({'_id':projectID})
				.populate('equipe')
				.exec(function (err,project) {
					 if (err) {
							reject('Impossible de trouver le projet avec l ID'+projectID);
							return;
						}
						
						resolve(project);
				
				});
			
		})
	}	
	function fetchMember(memberID,members){
		
		for (var i = 0, length = members.length; i < length; i++) {
			
				if(members[i]._id==memberID.toString()){
					return(members[i]);
				}else{
					return('member not found for this project');
				}

			
		}
	}
	app.get('/getSpeceficMemberOfaPoject/:projectID/:memberID',function(req,res) {

		let projectID=req.params.projectID;
		let memberID=req.params.memberID;
		
		fetchTeam(projectID).then(function (project) {
		res.send(fetchMember(memberID,project.equipe));
		}).catch(function (err) {
			console.error(err);
		});	
	
	
	});	
		
	
	// alert worker not finished job	
	app.post('/alert/worker/:workerJob', function(req, res, next) {
		
		var workerJob = req.params.workerJob;
		console.log(req.params.workerJob);
		Job
		.findOne({'_id':workerJob })
		.populate('employe')
		.exec(function (err,worker) {
		  if (err) return handleError(err);
			worker.employe.update({alerts:"this work was singaled by the Admin Manager Please Explain"}, function(err, numberAffected, rawResponse) {
				//handle it
			})
			worker.employe.save();
			console.log('The worker to alert is %s', worker.employe);
		
		});		
	})
	//create a project 
	app.post('/createProject', function(req, res, next) {		
		var projectTitle = req.body.title;
		var projectDescription = req.body.description;
		console.log(projectTitle,projectDescription);	
		Project.findOne({ 'projectTitle' : projectTitle}, function(err, project) {
			// if there are any errors, return the error
			if (err)
				return (err);

			// check to see if theres already a user with that email
			if (project) {
				return (err);
			} else {

				// if there is no user with that email
				// create the user
				var newproject= new Project({ title: projectTitle, description:projectDescription});
				   newproject.save(function(err) {
						
					  if (err) {
						console.log(err);
					
					  } else {
						
					  }
				});
				User.findOne({ 'email' :'mouadhakrout@gmail.com'}, function(err, admin) {
					
					 if (err) {
							console.log(err);
						
						  } else {
							newproject.owner=admin;
							newproject.save();
							console.log(admin);
							admin.projects.push(newproject._id);
							admin.save();
							
								
						  }
			
				})
			res.json(200);
		}});

	})
	// delete project=>delete related users and jobs
	app.delete('/projects/:id', function (req, res) {
		var id = req.params.id; 	  
		Project.findOne({_id:id}, function(err, project){
			project.remove(function(err,doc){
				 if(!err) {
					 User.update({_id: project.equipe}, 
						  {$pull: {projects: project._id}}, 
							  function (err) {
							   if (err) { console.error(err) }
								res.json(doc);
						  } )
						 } 
						  else {
							console.log(err);                                      
						}
			})

		});	
	});
	//create worker by project
	app.post('/createUserByProjectTitle/:projectTitle', function(req, res, next) {		
		var projectTitle=req.params.projectTitle;
		var tempPath = req.files.file.path,
		targetPath = path.resolve('./public/views/uploads/'+req.files.file.originalFilename);    
		fs.rename(tempPath, targetPath, function (err) {
		  if (err) throw err;
		  console.log('renamed complete');
		});
		var name = JSON.parse(req.body.model).name;
		var username = JSON.parse(req.body.model).username;
		var email = JSON.parse(req.body.model).email;
		var password = JSON.parse(req.body.model).password;
		var admin = JSON.parse(req.body.model).admin;
		var userJob=JSON.parse(req.body.model).userJob;
		var level=JSON.parse(req.body.model).level;
		var userImage=req.files.file;
		var currentDate=new Date();
		var createdOn =moment(currentDate, "MM-DD-YYYY hh:mma");
		
		if(admin=='YES'){
			admin=true;
		}else{
			admin=false;
		}
		  // setup e-mail data with unicode symbols
		var mailOptions = {
			from: 'mouadhakrout@gmail.com', // sender address
			to: 'mouadhakrout@gmail.com', // list of receivers
			subject: 'Job Assigner Password',
			text: 'Bonjour '+name+' '+username+' '+' voici votre mot de passe Job Assigner : '+password,
			html: '<b>'+'Bonjour '+name+' '+username+' '+' voici votre mot de passe Job Assigner : '+password+'</b>' 
		}
		new Account({ email: email, password:password,level:level}).save();
		transporter.sendMail(mailOptions, function(error, info){
			//if(error){
				//return console.log(error);
			}
			//console.log('Message sent: ' + info.response);
		);		
		Project.findOne({ 'title' : projectTitle}, function(err, project) {
				
				 if (err) {
						console.log(err);
					
					  } else {
								
							User.findOne({ 'email' : email}, function(err, user) {
								// if there are any errors, return the error
								if (err)
									return (err);

								// check to see if theres already a user with that email
								if (user) {
									return (err);
								} else {
									// if there is no user with that email
									// create the user
									var newuser= new User({ name: name, username:username, password:password,email:email,level:level,admin:admin,createdOn:createdOn,userImage:userImage,isAdmin:false});
									Project.findOne({'title':projectTitle})
									.populate('owner')
									.exec(function (err,project) {
									  if (err) return handleError(err);
											
											newuser.update({licence:project.owner[0].licence,password:newuser.generateHash(password)}, function(err, numberAffected, rawResponse) {
														   //handle it
														 })																						
										})
									   newuser.projects.push(project);
									   newuser.save(function(err) {
											
										  if (err) {
											console.log(err);
										
										  } else {											  	
											console.log(newuser._id);
											project.equipe.push(newuser._id);
											project.save();
											res.json(200);
											
										  }
									});
						
								}
							})
					  }
		})				
			
    });	
	// delete user by project
	app.delete('/users/:id', function (req, res) {		
	    var id = req.params.id;	 
		User.findOne({'_id':id}, function(err,user){
			
				user.remove(function(err,doc){
					 if(!err) {
						 Project.update({_id: user.projects}, 
							  {$pull: {equipe: user._id}}, 
								  function (err) {
								   if (err) { console.error(err) }
									
									Job.update({_id: user.jobs}, 
									{$pull: {employe: user._id}}, 
									function (err) {if (err) { console.error(err) }
									res.json(doc);
									})
								  })
				} 
					else {
							console.log(err);                                      
							}	
				})

		});	
	});
	// job status validate
	app.post('/jobStatusValidate/:id', function(req, res) {
		var id = req.params.id;
		var jobStatus = req.body.jobStatus ;
		if((jobStatus.replace(/\s/g,'').localeCompare('Finished'))!=0&&new Date()>=new Date(req.body.finishOn)){
			
		}
		else
		Job.update({_id: id}, {
		jobStatus: jobStatus
		}, function(err, numberAffected, rawResponse) {
		   //handle it
		})
		 
	});
	
	//create job by user
	app.post('/createjobByUser/:id', function(req, res) {
		var jobDetail = req.body.jobDetail;
		var  projectTitle=req.body.projectTitle;
		var userId = req.body.userId;
		var title= req.body.title;
		var beginOn = req.body.beginOn;
		var finishOn= req.body.finishOn;
		var url='localhost';
		Job.findOne({ 'detail' : jobDetail}, function(err, job) {
			// if there are any errors, return the error
			if (err)
				return (err);

			// check to see if theres already a user with that email
			if (job) {
				return (err);
			} else {
				
			   var newjob= new Job({ projectTitle:projectTitle,title: title,
					detail:jobDetail,
					employe:userId,
					beginOn:new Date(beginOn),
					finishOn:new Date(finishOn),alertWorker:false});
					console.log(newjob);
					
					newjob.save(function(err) {

					if (err) {
						console.log(err);
				   
					} else {
					  
					}
				});
				User.findOne({ _id :userId}, function(err, user) {
						 if (err) {
								console.log(err);
							
							  } else {
								console.log(newjob);
								user.jobs.push(newjob._id);
								user.save();
								
									
							  }
							res.json(200);
				})
		}})
	});

	// gets ======================================
	// get projects
	app.get('/projects', function(req, res) {
	  Project.find(function (err, projects) {

		  res.send(projects);

	  });
	});

	app.get('/jobsList', function(req, res) {
		res.sendFile( __dirname + "/views/" + "usersJobs.html" );
	});

	var bodyParser = require('body-parser');
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json()); // for parsing application/json
	var request = require('request');

	// get jobs by project
	app.get('/jobs/:projectTitle', function(req, res) {
		var projectTitle = req.params.projectTitle.replace(" ","%20");
		console.log(projectTitle);
		Job.find({projectTitle: projectTitle}, function (err,doc) {
			 if(err){
				 
			 }else{

			 res.json(doc);
			
			 }
		});
	});	
	// get alerted workers
	app.get('/alertWorkers/:projectTitle', function(req, res) {

		var projectTitle = req.params.projectTitle;
		global.alertUsers=[];
		projectTitle = encodeURIComponent(projectTitle.trim())
		Job.find({projectTitle: projectTitle}).exec(function (err, jobs) {
			
			if(err){
				 
			}else{
				 
				jobs.forEach(function(job, index) {

						 if(err){
							 
						 }else{
									
								if((job.jobStatus!=undefined)&&(job.jobStatus.replace(/\s/g,'').localeCompare('Finished'))!=0&&job.finishOn<=new Date()){
									job.update({alertWorker: true}, function(err, numberAffected, rawResponse) {
									   //handle it
									})
			
							
								}
				
				}});
				console.log("job is" ,jobs);
				res.json(jobs);

			}
			 }
			)		
		})	
	// get users by project
	app.get('/users/:projectTitle', function(req, res) {
		var projectTitle = req.params.projectTitle;
		Job.find().where('finishOn').gt(new Date()).exec(function (err, jobs) {
		 if(err){
				 
			 }else{
				 
				jobs.forEach(function(job, index) {
						 
						User.find({_id:job.employe}, function (err,doc) {
						 if(err){
							 
						 }else{
							if(doc[0]!=undefined){console.log(doc[0]);
							
							

							}

							
						 }});

					})
			 }
					
		})	
		Project.findOne({'title':projectTitle})
		.populate('equipe')
		.exec(function (err,project) {
		  if (err) return handleError(err);
				res.json(project.equipe);
																								
		})

	});

	// GET: /accounts
	app.get('/accounts', function(req, res) {
	  Account.find(function (err,accounts ) {

		  res.send(accounts);

	  });
	});

	// GET: /jobs
	app.get('/jobs', function(req, res) {

	  Job.find(function (err, jobs) {
		
		res.send(jobs);

	  });
	});

	// GET: /user
	app.get('/users', function(req, res) {
	 
	  User.find(function (err,users) {
	   
		res.send(users);

	  });
	})

	// GET: /jobs
	app.get('/job/:userId', function(req, res) {
	  var id = req.params.userId;
	  Job.find({employe: id},function (err, jobs) {
		console.log(jobs);
		res.send(jobs);

	  });
	});
	app.get('/admins', function (req, res) {

	  
		Admin.find( function (err, doc) {
			
			res.json(doc);
			
		});
	});
	app.get('/user/:id', function (req, res) {

		var id = req.params.id;
		console.log(id);
		User.findOne({_id: id}, function (err, doc) {
			console.log(doc);
			res.json(doc);
			
		});
	});
	app.delete('/deleteprojects', function (req, res) {
		console.log(res);
		Project.remove( function (err,doc) {

		});
		User.remove( function (err,doc) {
			
		});
		Account.remove( function (err,doc) {

		// if no error, your model is removed
		});
		Job.remove( function (err,doc) {
			console.log()
			 res.json(doc);
		// if no error, your model is removed
		});
		
			
	});
	app.delete('/jobs', function (req, res) {

		 Job.remove(function (err, doc) {
			res.json(doc);
		  });
	});


	app.delete('/jobs/:projectTitle', function (req, res) {
		 var projectTitle = req.params.projectTitle;
		 Job.remove({projectTitle: projectTitle}, function (err, doc) {
			res.json(doc);
		  });
	});

	app.delete('/job/:id', function (req, res) {
		 var id = req.params.id;		 
		 Job.findOne({_id:id}, function(err, job){
			job.remove(function(err,doc){
				 if(!err) {
					 User.update({_id: job.employe}, 
						  {$pull: {jobs: job._id}}, 
							  function (err) {
							   if (err) { console.error(err) }
								res.json(doc);
						  } )
						 } 
						  else {
							console.log(err);                                      
						}
			})
		 })
	});

	app.delete('/deleteUsers', function (req, res) {
	   //Account.remove( function (err, doc) {
		//res.json(doc);
	  //});
	  User.remove( function (err, doc) {
		res.json(doc);
	  });
	});	
};

// route middleware to make sure
function valideLicence(req, res, next) {
	console.log(req.user.licence);
	// if user is authenticated in the session, carry on	
	if (req.user.licence>=new Date())
		console.log('true');
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}


// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();
	// if they aren't redirect them to the home page
	res.redirect('/');
}
