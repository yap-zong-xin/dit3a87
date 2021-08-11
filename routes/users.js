var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var User = require("../models/user");
var Comment = require("../models/comment");
var Review = require("../models/review");
var listing = require("../models/listing");
var Notification = require("../models/notification");
var multer = require('multer');
var getClickRate = require("../public/javascripts/clickRate");
const axios = require('axios');
async function countApi(url) {
	const host = "https://api.countapi.xyz"
	try {
	  return await axios.get(host + url);
	} catch (err) {
	  console.log('myRequest error', err)
	}
}

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed.'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})
var uploadMultiple = upload.fields([ { name: 'profileImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 } ]);

var cloudinary = require('cloudinary');
const { filter } = require('async');
cloudinary.config({ 
  cloud_name: 'yappy', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//Email
var nodemailer = require("nodemailer");

var { google } = require('googleapis');
const user = require('../models/user');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Dashboard
//Get Route - Overview Dashboard
router.get("/dashboard", middleware.isAdmin, function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else {
			listing.find({}, function(err, alllistings){
				if(err){
					console.log(err);
				} else{
						Review.find({}, function(err, allReviews){
							if(err){
								console.log(err);
							} else{
								Comment.find({}, function(err, allComments){
									if(err){
										console.log(err);
									} else{
										res.render("dashboards/index.ejs", {users:allUsers, listings:alllistings, reviews:allReviews, comments:allComments});
									}
								});
							}
						});
					}
			});
		}
	});
});

//Get Route - Manage Accounts Dashboard
router.get("/dashboard/accounts", middleware.isAdmin, function(req, res){
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		if(req.query.sort) {
			// Sort object (to be passed into .sort)
			var sortOptions = {};
			var sort = req.query.sort;
			if(sort == 'LowestRating') {
				sortOptions.rating = 1;
			}else if(sort == 'HighestRating') {
				sortOptions.rating = -1 ;
			} else if(sort == 'Recent') {
				sortOptions.createdAt = -1;
			}else if(sort == 'Oldest') {
				sortOptions.createdAt = 1;
			}
	
			if(Object.keys(sortOptions).length == 0) {
				sortOptions.createdAt = -1
			}
	
			//filter acc type
			if(req.query.filterAccType) {
				// console.log(req.query.filterAccType)
				var filterOptions = {};
				var filterAccType = req.query.filterAccType;
				// filterOptions.isAdmin = false;
				// filterOptions.isAgent = false;
				console.log('filter chosen: ', filterAccType);
				if(filterAccType == 'Admin') {
					console.log('admin chosen')
					User
					.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}], isAdmin: true})
					.sort(sortOptions)
					.skip((perPage * pageNumber) - perPage)
					.limit(perPage)
					.exec(function (err, allUsers) {
						User.count(
							{$or: [{username: regex}, {firstName: regex}, {lastName: regex}]
							, isAdmin: true})
							.exec(function (err, count) {
							if (err) {
								console.log(err);
							} else {
								if(allUsers.length < 1) {
									noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
								}
								res.render("dashboards/accounts/index.ejs", {
									users: allUsers,
									current: pageNumber,
									pages: Math.ceil(count / perPage),
									noMatch: noMatch,
									search: req.query.search,
									filterAccType: req.query.filterAccType,
									sort: req.query.sort,
									data: req.query
								});
							}
						});
					});
				}else if(filterAccType == 'Agent') {
					console.log('agent chosen')
					User
					.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}], isAgent: true})
					.sort(sortOptions)
					.skip((perPage * pageNumber) - perPage)
					.limit(perPage)
					.exec(function (err, allUsers) {
						User.count({$or: [{username: regex}, {firstName: regex}, {lastName: regex}], isAgent: true}).exec(function (err, count) {
							if (err) {
								console.log(err);
							} else {
								if(allUsers.length < 1) {
									noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
								}
								res.render("dashboards/accounts/index.ejs", {
									users: allUsers,
									current: pageNumber,
									pages: Math.ceil(count / perPage),
									noMatch: noMatch,
									search: req.query.search,
									filterAccType: req.query.filterAccType,
									sort: req.query.sort,
									data: req.query
								});
							}
						});
					});
				} else if(filterAccType == 'Seeker') {
					console.log('seeker chosen')
					User
					.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}], isAgent: false, isAdmin: false})
					.sort(sortOptions)
					.skip((perPage * pageNumber) - perPage)
					.limit(perPage)
					.exec(function (err, allUsers) {
						User.count({$or: [{username: regex}, {firstName: regex}, {lastName: regex}], isAgent: false, isAdmin: false}).exec(function (err, count) {
							if (err) {
								console.log(err);
							} else {
								if(allUsers.length < 1) {
									noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
								}
								res.render("dashboards/accounts/index.ejs", {
									users: allUsers,
									current: pageNumber,
									pages: Math.ceil(count / perPage),
									noMatch: noMatch,
									search: req.query.search,
									filterAccType: req.query.filterAccType,
									sort: req.query.sort,
									data: req.query
								});
							}
						});
					});
				}else if(filterAccType == 'All') {
					User
					.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}]})
					.sort(sortOptions)
					.skip((perPage * pageNumber) - perPage)
					.limit(perPage)
					.exec(function (err, allUsers) {
						User.count(
							{$or: [{username: regex}, {firstName: regex}, {lastName: regex}]})
							.exec(function (err, count) {
							if (err) {
								console.log(err);
							} else {
								if(allUsers.length < 1) {
									noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
								}
								console.log("user.js current page number: " + pageNumber)
								console.log("user.js total pages: " + Math.ceil(count / perPage))

								res.render("dashboards/accounts/index.ejs", {
									users: allUsers,
									current: pageNumber,
									pages: Math.ceil(count / perPage),
									noMatch: noMatch,
									search: req.query.search,
									filterAccType: req.query.filterAccType,
									sort: req.query.sort,
									data: req.query
								});
							}
						});
					});
				}

			} else {
				User
				.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}]})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({$or: [{username: regex}, {firstName: regex}, {lastName: regex}]}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							if(allUsers.length < 1) {
								noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
							}
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			}

		} else {
			User
			.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}]})
			.skip((perPage * pageNumber) - perPage)
			.limit(perPage)
			.exec(function (err, allUsers) {
				User.count({$or: [{username: regex}, {firstName: regex}, {lastName: regex}]}).exec(function (err, count) {
					if (err) {
						console.log(err);
						res.redirect("back");
					} else {
						if(allUsers.length < 1) {
							noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
						}
						res.render("dashboards/accounts/index.ejs", {
							users: allUsers,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: req.query.search,
							filterAccType: req.query.filterAccType,
							sort: req.query.sort,
							data: req.query
						});
					}
				});
			});
		}
	} else if(req.query.sort) {
		// Sort object (to be passed into .sort)
		var sortOptions = {};
		var sort = req.query.sort;
		if(sort == 'LowestRating') {
			sortOptions.rating = 1;
		}else if(sort == 'HighestRating') {
			sortOptions.rating = -1 ;
		} else if(sort == 'Recent') {
			sortOptions.createdAt = -1;
		}else if(sort == 'Oldest') {
			sortOptions.createdAt = 1;
		}

		if(Object.keys(sortOptions).length == 0) {
			sortOptions.createdAt = -1
		}

		if(req.query.filterAccType) {
			// console.log(req.query.filterAccType)
			var filterOptions = {};
			var filterAccType = req.query.filterAccType;
			// filterOptions.isAdmin = false;
			// filterOptions.isAgent = false;
			console.log('filter chosen: ', filterAccType);
			if(filterAccType == 'Admin') {
				console.log('admin chosen')
				User
				.find({isAdmin: true})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({isAdmin: true}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			}else if(filterAccType == 'Agent') {
				console.log('agent chosen')
				User
				.find({isAgent: true})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({isAgent: true}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			} else if(filterAccType == 'Seeker') {
				console.log('seeker chosen')
				User
				.find({isAgent: false, isAdmin: false})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({isAgent: false, isAdmin: false}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			}else if(filterAccType == 'All') {
				User
				.find({})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			}

		} else {
			User
			.find({})
			.sort(sortOptions)
			.skip((perPage * pageNumber) - perPage)
			.limit(perPage)
			.exec(function (err, allUsers) {
				User.count({}).exec(function (err, count) {
					if (err) {
						console.log(err);
					} else {
						res.render("dashboards/accounts/index.ejs", {
							users: allUsers,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: req.query.search,
							filterAccType: req.query.filterAccType,
							sort: req.query.sort,
							data: req.query
						});
					}
				});
			});
		}
	} else if (req.query.filterAccType) {
			console.log(req.query.filterAccType)
			var filterOptions = {};
			var filterAccType = req.query.filterAccType;
			// filterOptions.isAdmin = false;
			// filterOptions.isAgent = false;
			console.log('filter chosen: ', filterAccType);
			if(filterAccType == 'Admin') {
				console.log('admin chosen')
				User
				.find({isAdmin: true})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({isAdmin: true}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			} else if(filterAccType == 'Agent') {
				console.log('agent chosen')
				User
				.find({isAgent: true})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({isAgent: true}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			} else if(filterAccType == 'Seeker') {
				console.log('seeker chosen')
				User
				.find({isAgent: false, isAdmin: false})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({isAgent: false, isAdmin: false}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			} else if(filterAccType == 'All') {
				User
				.find({})
				.sort(sortOptions)
				.skip((perPage * pageNumber) - perPage)
				.limit(perPage)
				.exec(function (err, allUsers) {
					User.count({}).exec(function (err, count) {
						if (err) {
							console.log(err);
						} else {
							res.render("dashboards/accounts/index.ejs", {
								users: allUsers,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								filterAccType: req.query.filterAccType,
								sort: req.query.sort,
								data: req.query
							});
						}
					});
				});
			}
	} else {
		// get all users from DB
		User
		.find({})
		.skip((perPage * pageNumber) - perPage)
		.limit(perPage)
		.exec(function (err, allUsers) {
			User.count({}).exec(function (err, count) {
				if (err) {
					console.log(err);
				} else {
					res.render("dashboards/accounts/index.ejs", {
						users: allUsers,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						noMatch: noMatch,
						search: req.query.search,
						filterAccType: req.query.filterAccType,
						sort: req.query.sort,
						data: req.query
					});
				}
			});
		});
	}
});

//Put Route - Manage Agent Application at Profile Page
router.put("/agentStatus/:id", middleware.isAdmin, function(req, res){
//can straight away use req.body.listing without having to define due to "listing[]" in the form name attributes
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
		if(err){
			res.redirect("/listings");
		} else{
			//Handling
			var successMsg = "";
			var choiceAgent = JSON.parse(req.body.user.agentStatus)
			var agentOption = "";
			if(choiceAgent == true) {
				successMsg = " has been approved."
				agentOption = " APPROVED"
			}else {
				successMsg = " has been disapproved."
				agentOption = " DISAPPROVED"
			}
			//Email
			async function sendMail() {
				try {
					const accessToken = await oAuth2Client.getAccessToken()

					const transport = nodemailer.createTransport({
						service: 'gmail',
						auth: {
							type: 'OAuth2',
							user: 'jptestingsku@gmail.com',
							clientId: CLIENT_ID,
							clientSecret: CLIENT_SECRET,
							refreshToken: REFRESH_TOKEN,
							accessToken: accessToken
						}
					});

					const mailOptions = {
						from: '3D Property Website <jptestingsku@gmail.com>',
						to: updatedUser.email,
						subject: 'Agent Account Approval',
						html : "Hello <strong>" + updatedUser.username + "</strong>,<br><br>Your agent account has been "+agentOption+".<br><br>"
					};

					const result = await transport.sendMail(mailOptions);
					return result; 
				}catch (error) {
					return error;
				}
			}
			sendMail()
			.then(result => console.log('Suspension Email Sent...', result))
			.then(req.flash("success", 'Email sent. '+updatedUser.username+successMsg))
			.then(res.redirect("/user/" + req.params.id))
			.catch(error => console.log(error.message))
		}
	});
});
//Put Route - Manage Agent Application at Dashboard Agent Page
router.put("/dashboardAgent/agents/:id", middleware.isAdmin, function(req, res){
//can straight away use req.body.listing without having to define due to "listing[]" in the form name attributes
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
		if(err){
			res.redirect("/listings");
		} else{
			//Handling
			var successMsg = "";
			var choiceAgent = JSON.parse(req.body.user.agentStatus)
			var agentOption = "";
			if(choiceAgent == true) {
				successMsg = " has been approved."
				agentOption = " APPROVED"
			}else {
				successMsg = " has been disapproved."
				agentOption = " DISAPPROVED"
			}
			//Email
			async function sendMail() {
				try {
					const accessToken = await oAuth2Client.getAccessToken()

					const transport = nodemailer.createTransport({
						service: 'gmail',
						auth: {
							type: 'OAuth2',
							user: 'jptestingsku@gmail.com',
							clientId: CLIENT_ID,
							clientSecret: CLIENT_SECRET,
							refreshToken: REFRESH_TOKEN,
							accessToken: accessToken
						}
					});

					const mailOptions = {
						from: '3D Property Website <jptestingsku@gmail.com>',
						to: updatedUser.email,
						subject: 'Agent Account Approval',
						html : "Hello <strong>" + updatedUser.username + "</strong>,<br><br>Your agent account has been "+agentOption+".<br><br>"
					};

					const result = await transport.sendMail(mailOptions);
					return result; 
				}catch (error) {
					return error;
				}
			}
			sendMail()
			.then(result => console.log('Suspension Email Sent...', result))
			.then(req.flash("success", 'Email sent. '+updatedUser.username+successMsg))
			.then(res.redirect("/dashboard/accounts/agent"))
			.catch(error => console.log(error.message))
		}
	});
});

//Get Route - Manage Comment Dashboard
router.get("/dashboard/comments", middleware.isAdmin, function(req, res){
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Comment.find({text: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allComments) {
			Comment.count({text: regex}).exec(function (err, count) {
				if (err) {
					console.log(err);
					res.redirect("back");
				} else {
					if(allComments.length < 1) {
						noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
					}
					res.render("dashboards/comments/index.ejs", {
						comments: allComments,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						noMatch: noMatch,
						search: req.query.search
					});
				}
			});
		});
	} else {
		// get all users from DB
		Comment.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allComments) {
			Comment.count().exec(function (err, count) {
				if (err) {
					console.log(err);
				} else {
					res.render("dashboards/comments/index.ejs", {
						comments: allComments,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						noMatch: noMatch,
						search: false
					});
				}
			});
		});
	}
});

//Get Route - Manage Review Dashboard
router.get("/dashboard/reviews", middleware.isAdmin, function(req, res){
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Review.find({text: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allReviews) {
			Review.count({text: regex}).exec(function (err, count) {
				if (err) {
					console.log(err);
					res.redirect("back");
				} else {
					if(allReviews.length < 1) {
						noMatch = "Result: '" + req.query.search + "' not found. Please try again.";
					}
					res.render("dashboards/reviews/index.ejs", {
						reviews: allReviews,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						noMatch: noMatch,
						search: req.query.search
					});
				}
			});
		});
	} else {
		// get all users from DB
		Review.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allReviews) {
			Review.count().exec(function (err, count) {
				if (err) {
					console.log(err);
				} else {
					res.render("dashboards/reviews/index.ejs", {
						reviews: allReviews,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						noMatch: noMatch,
						search: false
					});
				}
			});
		});
	}
});

// router.get("/dashboard/listings", function(req,res){
// 	listing.find({}, function(err, alllistings){
// 		if(err){
// 			console.log(err);
// 		} else{
// 			res.render("dashboards/manageListings.ejs", {listings:alllistings});
// 		}
// 	});
// });

//Get Route - Manage Listings Dashboard
// router.get("/dashboard/listings", function(req,res){
// 	listing.find({}).populate("comments likes").exec(function(err, foundlisting){
// 		if(err){
// 			console.log(err);
// 		} else{
// 			// var obj = {listings:foundlisting}
// 			// var lengthObj = {listings:foundlisting.length}
// 			// var max = Object.values(lengthObj)[0];
// 			// var arrStr = [];
// 			// var idArr = [];

// 			// //create array and loop through all listings to get ID
// 			// for (var i = 0; i < max ; i++) {
// 			// 	var idObj = {listings:foundlisting[i]._id}
// 			// 	var id = Object.values(idObj)[0];
// 			// 	idArr[i] = id;
// 			// }

// 			// async function getShow(url) {
// 			// 	var result;
// 			// 	result = await countApi("/get/3dpropertylistingsg/" + url)
// 			// 	.then(success => {
// 			// 		return success.data.value;
// 			// 	})
// 			// 	return result;
// 			// }
			
// 			// async function getShow2(url) {
// 			// 	var result;
// 			// 	result = await countApi("/get/3dpropertylistingsg/" + url + "-click")
// 			// 	.then(success => {
// 			// 		return success.data.value;
// 			// 	})
// 			// 	return result;
// 			// }

// 			// async function clickRateCalc() {
// 			// 	idArr.forEach(async function(url, i) {
// 			// 		var e = await getShow(url)
// 			// 		var f = await getShow2(url)
// 			// 		var rateArr = [url,e,f];
// 			// 		arrStr.push(rateArr);
// 			// 		if(arrStr.length == idArr.length) {
// 			// 			//calculate clickrate
// 			// 			arrStr.forEach(function(item, i) {
// 			// 				var id = arrStr[i][0];
// 			// 				var clickCount = arrStr[i][1];
// 			// 				var shownCount = arrStr[i][2]
// 			// 				var clickRateStr = Math.round((clickCount/shownCount) * 100) + "%";

// 			// 				var obj = {
// 			// 					"id" : id,
// 			// 					"click" : clickCount,
// 			// 					"shown" : shownCount,
// 			// 					"clickRate" : clickRateStr
// 			// 				}

// 			// 				console.log(obj)
// 			// 			})
// 			// 			console.log("done")
// 			// 		}
// 			// 	});
// 			// }
// 			// clickRateCalc();
// 			res.render("dashboards/listings/index.ejs", {listings:foundlisting});
// 			// res.render("dashboards/manageListings.ejs", {listings:foundlisting, getClickRate:getClickRate});
// 		}
// 	});
// });

router.get("/dashboard/listings", middleware.isAdmin, function(req,res){
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;

	if(req.query.Apply || req.query.page) {
		console.log('1')
		console.log('wqer: ', typeof req.query.search)
		if(req.query.search) {
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		}
		//Search 
		// const regex = new RegExp(escapeRegex(req.query.search), 'gi');

		//Sort
		// Sort object (to be passed into .sort)
		var sortOptions = {};
		// Sort options
		var sort = req.query.sort;
		if(sort == 'LowestPrice') {
			sortOptions.price = 1;
		}else if(sort == 'HighestPrice') {
			sortOptions.price = -1 ;
		}else if(sort == 'Recent') {
			sortOptions.createdAt = -1;
		}else if(sort == 'Oldest') {
			sortOptions.createdAt = 1;
		}else if(sort == 'Sold') {
			sortOptions.soldStatus = -1;
		}else if(sort == 'NotSold') {
			sortOptions.soldStatus = 1;
		}else if(sort == 'Archive') {
			sortOptions.archiveStatus = -1;
		}else if(sort == 'NotArchive') {
			sortOptions.archiveStatus = 1;
		}else if(sort == 'MostPop') {
			sortOptions.likes = -1;
		}else if(sort == 'LeastPop') {
			sortOptions.likes = 1;
		}
		//if no sort is selected
		if(Object.keys(sortOptions).length == 0) {
			sortOptions.createdAt = 1
		}

		//Filter 
		var propType = req.query.filterPropType;
		var propTypeArr = [];
		if(propType == 'allType' || !propType) {
			propTypeArr = ['hdb', 'condo', 'executivecondo', 'landed', 'terrace', 'semidetached', 'detached'];
		}else {
			propTypeArr.push(req.query.filterPropType);
		}
		regexType = propTypeArr;
		// regexType = propTypeArr.map(function(e){return new RegExp(e, "gi");});

		if(req.query.search) {
			//Query
			listing.find({$and: [ {$or: [ {name: regex}, {description: regex}, {"author.username":regex} ]}, {type: {$in: regexType}}]}).sort(sortOptions).skip((perPage * pageNumber) - perPage).limit(perPage).populate('author.id').populate("comments likes").exec(function(err, foundlisting){
				listing.count({$and: [ {$or: [ {name: regex}, {description: regex}, {"author.username":regex} ]}, {type: {$in: regexType}}]}).exec(function (err, count) {
					if(err){
						console.log(err);
					} else{
						res.render("dashboards/listings/index.ejs", {
							listings:foundlisting,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: req.query.search,
							filterPropType: req.query.filterPropType,
							sort: req.query.sort,
							data: req.query,
						});
					}
				});
			});
		}else {
			//Query
			listing.find({$and: [ {type: {$in: regexType}}]}).sort(sortOptions).skip((perPage * pageNumber) - perPage).limit(perPage).populate('author.id').populate("comments likes").exec(function(err, foundlisting){
				listing.count({$and: [ {type: {$in: regexType}}]}).exec(function (err, count) {
					if(err){
						console.log(err);
					} else{
						res.render("dashboards/listings/index.ejs", {
							listings:foundlisting,
							current: pageNumber,
							pages: Math.ceil(count / perPage),
							noMatch: noMatch,
							search: req.query.search,
							filterPropType: req.query.filterPropType,
							sort: req.query.sort,
							data: req.query,
						});
					}
				});
			});
		}
	}else {
		console.log('2')
		//Load All Query
		listing.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).populate("comments likes").exec(function(err, foundlisting){
			listing.count().exec(function (err, count) {
				if(err){
					console.log(err);
				} else{
					res.render("dashboards/listings/index.ejs", {
						listings:foundlisting,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						noMatch: noMatch,
						search: req.query.search,
						filterPropType: req.query.filterPropType,
						sort: req.query.sort,
						data: req.query,
					});
				}
			});
		});
	}
	
	
	// if(req.query.search) {
	// 	const regex = new RegExp(escapeRegex(req.query.search), 'gi');

	// 	if (req.query.sort){
	// 		// Sort object (to be passed into .sort)
	// 		var sortOptions = {};
	// 		// Sort options
	// 		var sort = req.query.sort;
	// 		if(sort == 'LowestPrice') {
	// 			sortOptions.price = 1;
	// 		}else if(sort == 'HighestPrice') {
	// 			sortOptions.price = -1 ;
	// 		}else if(sort == 'Recent') {
	// 			sortOptions.createdAt = -1;
	// 		}else if(sort == 'Oldest') {
	// 			sortOptions.createdAt = 1;
	// 		}else if(sort == 'Sold') {
	// 			sortOptions.soldStatus = -1;
	// 		}else if(sort == 'NotSold') {
	// 			sortOptions.soldStatus = 1;
	// 		}else if(sort == 'Archive') {
	// 			sortOptions.archiveStatus = -1;
	// 		}else if(sort == 'NotArchive') {
	// 			sortOptions.archiveStatus = 1;
	// 		}else if(sort == 'MostPop') {
	// 			sortOptions.likes = -1;
	// 		}else if(sort == 'LeastPop') {
	// 			sortOptions.likes = 1;
	// 		}

	// 		//if no sort is selected
	// 		if(Object.keys(sortOptions).length == 0) {
	// 			sortOptions.createdAt = 1
	// 		}

	// 		if (req.query.filterPropType) {
	// 			var filterPropType = req.query.filterPropType;
	// 			var regexSold = [true, false];
	// 			var regexArchive = [true, false];
	// 			var regexType;
	// 			var slcType = ['hdb', 'condo', 'landed']
	// 			if(filterPropType == 'sold') {
	// 				regexSold = [true];
	// 			}else if(filterPropType == 'archive') {
	// 				regexArchive = [true];
	// 			}else if(filterPropType == 'hdb') {
	// 				slcType = ['hdb'];
	// 			}else if(filterPropType == 'condo') {
	// 				slcType = ['condo'];
	// 			}else if(filterPropType == 'landed') {
	// 				slcType = ['landed'];
	// 			}else if(filterPropType == 'all') {
	// 				slcType = ['hdb', 'condo', 'landed'];
	// 			}
	// 			regexType = slcType.map(function(e){return new RegExp(e, "gi");});
				
	// 			//QUERY (for both dropdown)
	// 			listing
	// 			.find({
	// 				$or: [{name: regex}, {zone:regex}, {type: regex}], 
	// 					type: {$in: regexType}, 
	// 					soldStatus: {$in: regexSold}, 
	// 					archiveStatus: {$in: regexArchive}
	// 					})
	// 			.sort(sortOptions)
	// 			.skip((perPage * pageNumber) - perPage)
	// 			.limit(perPage)
	// 			.populate("comments likes")
	// 			.exec(function(err, foundlisting){
	// 				listing.count({
	// 					$or: [{name: regex}, {zone:regex}, {type: regex}], 
	// 						type: {$in: regexType}, 
	// 						soldStatus: {$in: regexSold}, 
	// 						archiveStatus: {$in: regexArchive}
	// 						}).exec(function (err, count) {
	// 				if(err){
	// 					console.log(err);
	// 					res.redirect("back");
	// 				} else{	

	// 					res.render("dashboards/listings/index.ejs", {
	// 						listings:foundlisting,
	// 						current: pageNumber,
	// 						pages: Math.ceil(count / perPage),
	// 						noMatch: noMatch,
	// 						search: req.query.search,
	// 						filterPropType: req.query.filterPropType,
	// 						sort: req.query.sort,
	// 						data: req.query,
	// 					});
	// 				}
	// 			});
	// 			});
	// 		} else {
	// 			//QUERY (for one dropdown)
	// 			// listing.find({
	// 			//$and: [{type: {$in: regexType}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}}]})
	// 			listing.find({
	// 				$or: [{name: regex}, {zone:regex}, {type: regex}], 
	// 					type: {$in: regexType}, 
	// 					soldStatus: {$in: regexSold}, 
	// 					archiveStatus: {$in: regexArchive}
	// 					})
	// 			.sort(sortOptions).skip((perPage * pageNumber) - perPage).limit(perPage).populate("comments likes").exec(function(err, foundlisting){
	// 				listing.count()
	// 				.exec(function (err, count) {
	// 				if(err){
	// 					console.log(err);
	// 					res.redirect("back");
	// 				} else{
	// 					res.render("dashboards/listings/index.ejs", {
	// 						listings:foundlisting,
	// 						current: pageNumber,
	// 						pages: Math.ceil(count / perPage),
	// 						noMatch: noMatch,
	// 						search: req.query.search,
	// 						filterPropType: req.query.filterPropType,
	// 						sort: req.query.sort,
	// 						data: req.query,
	// 					});
	// 				}
	// 				});
	// 			});
	// 		}
	// 	} else {
	// 		if (req.query.filterPropType) {
	// 			var filterPropType = req.query.filterPropType;
	// 			var regexSold = [true, false];
	// 			var regexArchive = [true, false];
	// 			var regexType;
	// 			var slcType = ['hdb', 'condo', 'landed']
	// 			if(filterPropType == 'sold') {
	// 				regexSold = [true];
	// 			}else if(filterPropType == 'archive') {
	// 				regexArchive = [true];
	// 			}else if(filterPropType == 'hdb') {
	// 				slcType = ['hdb'];
	// 			}else if(filterPropType == 'condo') {
	// 				slcType = ['condo'];
	// 			}else if(filterPropType == 'landed') {
	// 				slcType = ['landed'];
	// 			}else if(filterPropType == 'all') {
	// 				slcType = ['hdb', 'condo', 'landed'];
	// 			}
	// 			regexType = slcType.map(function(e){return new RegExp(e, "gi");});
				
	// 			//QUERY (for both dropdown)
	// 			listing.find({
	// 				$or: [{name: regex}, {zone:regex}, {type: regex}], 
	// 					type: {$in: regexType}, 
	// 					soldStatus: {$in: regexSold}, 
	// 					archiveStatus: {$in: regexArchive}
	// 					})
	// 			.sort(sortOptions)
	// 			.skip((perPage * pageNumber) - perPage)
	// 			.limit(perPage)
	// 			.populate("comments likes")
	// 			.exec(function(err, foundlisting){
	// 				listing.count({
	// 					$or: [{name: regex}, {zone:regex}, {type: regex}], 
	// 						type: {$in: regexType}, 
	// 						soldStatus: {$in: regexSold}, 
	// 						archiveStatus: {$in: regexArchive}
	// 						}).exec(function (err, count) {
	// 				if(err){
	// 					console.log(err);
	// 					res.redirect("back");
	// 				} else{	

	// 					res.render("dashboards/listings/index.ejs", {
	// 						listings:foundlisting,
	// 						current: pageNumber,
	// 						pages: Math.ceil(count / perPage),
	// 						noMatch: noMatch,
	// 						search: req.query.search,
	// 						filterPropType: req.query.filterPropType,
	// 						sort: req.query.sort,
	// 						data: req.query,
	// 					});
	// 				}
	// 			});
	// 			});
	// 		} else {
	// 			listing.find({
	// 				$or: [{name: regex}, {zone:regex}, {type: regex}]})
	// 			.sort(sortOptions)
	// 			.skip((perPage * pageNumber) - perPage)
	// 			.limit(perPage)
	// 			.populate("comments likes")
	// 			.exec(function(err, foundlisting){
	// 				listing.count({
	// 					$or: [{name: regex}, {zone:regex}, {type: regex}]
	// 						}).exec(function (err, count) {
	// 				if(err){
	// 					console.log(err);
	// 					res.redirect("back");
	// 				} else{	

	// 					res.render("dashboards/listings/index.ejs", {
	// 						listings:foundlisting,
	// 						current: pageNumber,
	// 						pages: Math.ceil(count / perPage),
	// 						noMatch: noMatch,
	// 						search: req.query.search,
	// 						filterPropType: req.query.filterPropType,
	// 						sort: req.query.sort,
	// 						data: req.query,
	// 					});
	// 				}
	// 			});
	// 			});
	// 		}
	// 	}


	// }  else if (req.query.sort) {
	// 		// Sort object (to be passed into .sort)
	// 		var sortOptions = {};
	// 		// Sort options
	// 		var sort = req.query.sort;
	// 		if(sort == 'LowestPrice') {
	// 			sortOptions.price = 1;
	// 		}else if(sort == 'HighestPrice') {
	// 			sortOptions.price = -1 ;
	// 		}else if(sort == 'Recent') {
	// 			sortOptions.createdAt = -1;
	// 		}else if(sort == 'Oldest') {
	// 			sortOptions.createdAt = 1;
	// 		}else if(sort == 'Sold') {
	// 			sortOptions.soldStatus = -1;
	// 		}else if(sort == 'NotSold') {
	// 			sortOptions.soldStatus = 1;
	// 		}else if(sort == 'Archive') {
	// 			sortOptions.archiveStatus = -1;
	// 		}else if(sort == 'NotArchive') {
	// 			sortOptions.archiveStatus = 1;
	// 		}else if(sort == 'MostPop') {
	// 			sortOptions.likes = -1;
	// 		}else if(sort == 'LeastPop') {
	// 			sortOptions.likes = 1;
	// 		}

	// 		//if no sort is selected
	// 		if(Object.keys(sortOptions).length == 0) {
	// 			sortOptions.createdAt = 1
	// 		}

	// 		if (req.query.filterPropType) {
	// 			var filterPropType = req.query.filterPropType;
	// 			var regexSold = [true, false];
	// 			var regexArchive = [true, false];
	// 			var regexType;
	// 			var slcType = ['hdb', 'condo', 'landed']
	// 			if(filterPropType == 'sold') {
	// 				regexSold = [true];
	// 			}else if(filterPropType == 'archive') {
	// 				regexArchive = [true];
	// 			}else if(filterPropType == 'hdb') {
	// 				slcType = ['hdb'];
	// 			}else if(filterPropType == 'condo') {
	// 				slcType = ['condo'];
	// 			}else if(filterPropType == 'landed') {
	// 				slcType = ['landed'];
	// 			}else if(filterPropType == 'all') {
	// 				slcType = ['hdb', 'condo', 'landed'];
	// 			}
	// 			regexType = slcType.map(function(e){return new RegExp(e, "gi");});
				
	// 			//QUERY (for both dropdown)
	// 			listing
	// 			.find({$and: [{type: {$in: regexType}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}}]})
	// 			.sort(sortOptions).skip((perPage * pageNumber) - perPage).limit(perPage).populate("comments likes").exec(function(err, foundlisting){
	// 				listing.count({$and: [{type: {$in: regexType}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}}]}).exec(function (err, count) {
	// 				if(err){
	// 					console.log(err);
	// 					res.redirect("back");
	// 				} else{	
	// 					res.render("dashboards/listings/index.ejs", {
	// 						listings:foundlisting,
	// 						current: pageNumber,
	// 						pages: Math.ceil(count / perPage),
	// 						noMatch: noMatch,
	// 						search: req.query.search,
	// 						filterPropType: req.query.filterPropType,
	// 						sort: req.query.sort,
	// 						data: req.query,
	// 					});
	// 				}
	// 				});
	// 			});
	// 		} else {
	// 			//QUERY (for sort only)
	// 			// listing.find({
	// 			//$and: [{type: {$in: regexType}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}}]})
	// 			listing.find({})
	// 			.sort(sortOptions).skip((perPage * pageNumber) - perPage).limit(perPage).populate("comments likes").exec(function(err, foundlisting){
	// 				listing.count()
	// 				.exec(function (err, count) {
	// 				if(err){
	// 					console.log(err);
	// 					res.redirect("back");
	// 				} else{
	// 					res.render("dashboards/listings/index.ejs", {
	// 						listings:foundlisting,
	// 						current: pageNumber,
	// 						pages: Math.ceil(count / perPage),
	// 						noMatch: noMatch,
	// 						search: req.query.search,
	// 						filterPropType: req.query.filterPropType,
	// 						sort: req.query.sort,
	// 						data: req.query,
	// 					});
	// 				}
	// 				});
	// 			});
	// 		}
	// } else if (req.query.filterPropType) {
	// 	var filterPropType = req.query.filterPropType;
	// 	var regexSold = [true, false];
	// 	var regexArchive = [true, false];
	// 	var regexType;
	// 	var slcType = ['hdb', 'condo', 'landed']
	// 	if(filterPropType == 'sold') {
	// 		regexSold = [true];
	// 	}else if(filterPropType == 'archive') {
	// 		regexArchive = [true];
	// 	}else if(filterPropType == 'hdb') {
	// 		slcType = ['hdb'];
	// 	}else if(filterPropType == 'condo') {
	// 		slcType = ['condo'];
	// 	}else if(filterPropType == 'landed') {
	// 		slcType = ['landed'];
	// 	}else if(filterPropType == 'all') {
	// 		slcType = ['hdb', 'condo', 'landed'];
	// 	}
	// 	regexType = slcType.map(function(e){return new RegExp(e, "gi");});
		
	// 	//no sort
	// 	listing
	// 	.find({$and: [{type: {$in: regexType}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}}]})
	// 	.skip((perPage * pageNumber) - perPage).limit(perPage).populate("comments likes").exec(function(err, foundlisting){
	// 		listing.count({$and: [{type: {$in: regexType}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}}]}).exec(function (err, count) {
	// 		if(err){
	// 			console.log(err);
	// 			res.redirect("back");
	// 		} else{	
	// 			res.render("dashboards/listings/index.ejs", {
	// 				listings:foundlisting,
	// 				current: pageNumber,
	// 				pages: Math.ceil(count / perPage),
	// 				noMatch: noMatch,
	// 				search: req.query.search,
	// 				filterPropType: req.query.filterPropType,
	// 				sort: req.query.sort,
	// 				data: req.query,
	// 			});
	// 		}
	// 		});
	// 	});
	// } else {
	// 	listing.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).populate("comments likes").exec(function(err, foundlisting){
	// 		listing.count().exec(function (err, count) {
	// 			if(err){
	// 				console.log(err);
	// 			} else{
	// 				res.render("dashboards/listings/index.ejs", {
	// 					listings:foundlisting,
	// 					current: pageNumber,
	// 					pages: Math.ceil(count / perPage),
	// 					noMatch: noMatch,
	// 					search: req.query.search,
	// 					filterPropType: req.query.filterPropType,
	// 					sort: req.query.sort,
	// 					data: req.query,
	// 				});
	// 			}
	// 		});
	// 	});
	// }
});

//Profile
//Get Route
router.get("/user", function(req,res){
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		
		if (req.query.sort) {
			// Sort object (to be passed into .sort)
			var sortOptions = {};
			var sort = req.query.sort;
			if(sort == 'LowestRating') {
				sortOptions.rating = 1;
			}else if(sort == 'HighestRating') {
				sortOptions.rating = -1 ;
			} else if(sort == 'Recent') {
				sortOptions.createdAt = -1;
			}else if(sort == 'Oldest') {
				sortOptions.createdAt = 1;
			}

			if(Object.keys(sortOptions).length == 0) {
				sortOptions.createdAt = -1
			}

			User.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}, {cea: regex}], isAgent: true, agentStatus: true}).sort(sortOptions).exec(function(err, allUsers){
				if(err){
					console.log(err);
				} else{
					res.render("users/index.ejs", {
						users:allUsers, 
						noMatch: noMatch,
						data: req.query
					});
				}
			});
		} else {

			//search the different types (name/time/date)
			User.find({
				$or: [{username: regex}, {firstName: regex}, {lastName: regex}, {cea: regex}], 
				isAgent: true, 
				agentStatus: true
				}, function(err, allUsers){
				if(err){
					console.log(err);
				} else {
					if(allUsers.length < 1) {
						noMatch = "No agent match that query, please try again.";
					}
					res.render("users/index.ejs", {
						users: allUsers, 
						noMatch: noMatch,
						data: req.query
					});
				}
			});	
		}

	} else if(req.query.sort) {
		// Sort object (to be passed into .sort)
		var sortOptions = {};
		var sort = req.query.sort;
		if(sort == 'LowestRating') {
			sortOptions.rating = 1;
		}else if(sort == 'HighestRating') {
			sortOptions.rating = -1 ;
		} else if(sort == 'Recent') {
			sortOptions.createdAt = -1;
		}else if(sort == 'Oldest') {
			sortOptions.createdAt = 1;
		}

		if(Object.keys(sortOptions).length == 0) {
			sortOptions.createdAt = -1
		}

		User.find({isAgent: true, agentStatus: true}).sort(sortOptions).exec(function(err, allUsers){
			if(err){
				console.log(err);
			} else{
				res.render("users/index.ejs", {
					users:allUsers, 
					noMatch: noMatch,
					data: req.query
				});
			}
		});
	} else {
		User.find({isAgent: true, agentStatus: true}, function(err, allUsers){
			if(err){
				console.log(err);
			} else{
				res.render("users/index.ejs", {
					users:allUsers, 
					noMatch: noMatch,
					data: req.query
				});
			}
		});
	}
});

//Show Route
router.get("/user/:id", function (req, res) {
	var noMatch = null;
	//find the user with provided ID
	User.find({followers: req.params.id}).populate("followers").exec(function(err, userFollowing) {
		console.log('user following: ', userFollowing)
		let allFollowing = userFollowing;

		User.findById(req.params.id).populate("comments followers notifications").populate({
				path: "reviews",
				options: {sort: {createdAt: -1}}
		}).exec(function (err, foundUser) {
			if (err) {
				req.flash("error", "Something went wrong. Please try again.");
				console.log(err);
			} else {
				let allFollowers = foundUser.followers;
				let allNotifications = foundUser.notifications;
				// console.log("1" + allNotifications)
				// console.log("2" + foundUser)
				if(req.query.search){
					const regex = new RegExp(escapeRegex(req.query.search), 'gi');
					listing.find({$or: [{name:regex}, {zone:regex}, {type:regex}]}).where('author.id').equals(foundUser._id).exec(function(err, alllistings) {
						if(err) {
							req.flash("error", "Something went wrong. Please try again.");
							return res.redirect("/");
						} else {
							if(alllistings.length < 1) {
									// noMatch = "result: '" + req.query.search + "' not found";
							}
							// foundUser.notifications.image = foundUser.image
							res.render("users/show.ejs", {user: foundUser, listings: alllistings, allNotifications, allFollowers, allFollowing, noMatch: noMatch});
						}
					});
				} else {
					listing.find().where('author.id').equals(foundUser._id).exec(function(err, listings) {
						if(err) {
							req.flash("error", "Something went wrong. Please try again.");
							return res.redirect("/");
						}
						// foundUser.notifications.image = foundUser.image
						res.render("users/show.ejs", {user: foundUser, listings: listings, allNotifications, allFollowers, allFollowing, noMatch: noMatch});
					});
				}
			}
		});
	});
});

//Show Route
router.get("/user/:id/reviews", function (req, res) {
	//find the user with provided ID
	User.findById(req.params.id).populate("comments followers notifications").populate({
			path: "reviews",
			options: {sort: {createdAt: -1}}
	}).exec(function (err, foundUser) {
			if (err) {
				req.flash("error", "Something went wrong. Please try again.");
				console.log(err);
			} else {
				let allFollowers = foundUser.followers;
				let allNotifications = foundUser.notifications;
				// console.log("1" + allNotifications)
				// console.log("2" + foundUser)
				listing.find().where('author.id').equals(foundUser._id).exec(function(err, listings) {
					if(err) {
						req.flash("error", "Something went wrong. Please try again.");
						return res.redirect("/");
					}
					// foundUser.notifications.image = foundUser.image
					res.render("users/show-review.ejs", {user: foundUser, listings: listings, allNotifications, allFollowers});
				})
			}
	});
});

//Edit Account Route
router.get("/user/:id/edit", middleware.checkUserOwnership, function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/user");
		} else{
			res.render("users/edit.ejs", {user: foundUser});
		}
	});
});
router.get("/user/:id/manage", middleware.checkUserOwnership, function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/user");
		} else{
			res.render("users/edit-account.ejs", {user: foundUser});
		}
	});
});

//Update Route
router.put("/user/:id", middleware.checkUserOwnership, uploadMultiple, function(req, res){
	User.findById(req.params.id, async function(err, user){
		console.log(user)
		console.log(user.reviews)
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			if(req.files){
				try{
					if(req.files.profileImage){
						if(user.imageId != null) {
							await cloudinary.v2.uploader.destroy(user.imageId);
						}
						var result = await cloudinary.v2.uploader.upload(req.files.profileImage[0].path);
						user.image = result.secure_url;
						user.imageId = result.public_id;
					}
					if(req.files.bannerImage) {
						if(user.bannerId != null) {
							await cloudinary.v2.uploader.destroy(user.bannerId);
						}
						var result = await cloudinary.v2.uploader.upload(req.files.bannerImage[0].path);
						user.banner = result.secure_url;
						user.bannerId = result.public_id;
					}
				} catch(err){
						req.flash("error", 'try catch g: ',err.message);
						return res.redirect("back");
				}
			}
		}
		user.username = req.body.user.username;
		user.email = req.body.user.email;
		user.phone = req.body.user.phone;
		user.streetName = req.body.user.streetName;
		user.unitNumber = req.body.user.unitNumber;
		user.country = req.body.user.country;
		user.state = req.body.user.state;
		user.postalCode = req.body.user.postalCode;
		user.cea = req.body.user.cea;
		user.save();
		console.log(user)
		req.flash("success", "You have successfully updated the profile.");
		res.redirect("/user/" + user._id);
	});
});

router.put("/user/:id/banner", middleware.checkUserOwnership, upload.single("banner"), function(req, res){
	User.findById(req.params.id, async function(err, user){
		console.log(user)
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			if(req.file){
				try{
					if(user.bannerId!=null){
						await cloudinary.v2.uploader.destroy(user.bannerId);
					}
						var result = await cloudinary.v2.uploader.upload(req.file.path);
						user.banner = result.secure_url;
						user.bannerId = result.public_id;
				} catch(err){
						req.flash("error", err.message);
						return res.redirect("back");
				}
			}
		}
		user.save();
		console.log(user)
		req.flash("success", "You have successfully updated the profile banner.");
		res.redirect("/user/" + user._id);
	});
});

router.put("/user/:id/image", middleware.checkUserOwnership, upload.single("image"), function(req, res){
	User.findById(req.params.id, async function(err, user){
		console.log(user)
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			if(req.file){
				try{
					if(user.imageId!=null){
						await cloudinary.v2.uploader.destroy(user.imageId);
					}
						var result = await cloudinary.v2.uploader.upload(req.file.path);
						user.image = result.secure_url;
						user.imageId = result.public_id;
				} catch(err){
						req.flash("error", err.message);
						return res.redirect("back");
				}
			}
		}
		user.save();
		console.log(user)
		req.flash("success", "You have successfully updated the profile image.");
		res.redirect("/user/" + user._id);
	});
});

//Destroy Route
router.delete("/user/:id", middleware.checkUserOwnership, function(req, res){
	//Remove user 
	User.findByIdAndRemove(req.params.id, function(err, dltUser){
		if(err){
			res.redirect("/user");
		} else{
			//Handling
			var successMsg = " has been deleted.";
			var dltOption = "DELETED.";
			//Email
			async function sendMail() {
				try {
					const accessToken = await oAuth2Client.getAccessToken()

					const transport = nodemailer.createTransport({
						service: 'gmail',
						auth: {
							type: 'OAuth2',
							user: 'jptestingsku@gmail.com',
							clientId: CLIENT_ID,
							clientSecret: CLIENT_SECRET,
							refreshToken: REFRESH_TOKEN,
							accessToken: accessToken
						}
					});

					const mailOptions = {
						from: '3D Property Website <jptestingsku@gmail.com>',
						to: dltUser.email,
						subject: 'Account deletion',
						html : "Hello <strong>" + dltUser.username + "</strong>,<br><br>Your account has been "+dltOption+"<br><br>"
					};

					const result = await transport.sendMail(mailOptions);
					return result; 
				}catch (error) {
					return error;
				}
			}
			sendMail()
			.then(result => console.log('Delete Email Sent...', result))
			.then(req.flash("success", 'Email sent. '+dltUser.username+successMsg))
			.then(res.redirect("/login"))
			.catch(error => console.log(error.message))
		}
	});

	//Remove Users listing
	listing.remove( { "author.id": req.params.id } ).populate('author.id').exec(function (err, dltListing) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from listing: ', dltListing);
		}
	});
	//Remove Users reviews
	Review.remove( { "author.id": req.params.id } ).populate('author.id').exec(function (err, dltReview) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from reviews: ', dltReview);
		}
	});
	//Remove Users comments
	Comment.remove( { "author.id": req.params.id } ).populate('author.id').exec(function (err, dltComment) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from comments: ', dltComment);
		}
	});
});
//Destroy Route at Dashboard
router.delete("/user/:id/dashboard", middleware.isAdmin, function(req, res){
	//Remove user 
	User.findByIdAndRemove(req.params.id, function(err, dltUser){
		if(err){
			res.redirect("/user");
		} else{
			//Handling
			var successMsg = " has been deleted.";
			var dltOption = "DELETED.";
			//Email
			async function sendMail() {
				try {
					const accessToken = await oAuth2Client.getAccessToken()

					const transport = nodemailer.createTransport({
						service: 'gmail',
						auth: {
							type: 'OAuth2',
							user: 'jptestingsku@gmail.com',
							clientId: CLIENT_ID,
							clientSecret: CLIENT_SECRET,
							refreshToken: REFRESH_TOKEN,
							accessToken: accessToken
						}
					});

					const mailOptions = {
						from: '3D Property Website <jptestingsku@gmail.com>',
						to: dltUser.email,
						subject: 'Account deletion',
						html : "Hello <strong>" + dltUser.username + "</strong>,<br><br>Your account has been "+dltOption+"<br><br>"
					};

					const result = await transport.sendMail(mailOptions);
					return result; 
				}catch (error) {
					return error;
				}
			}
			sendMail()
			.then(result => console.log('Delete Email Sent...', result))
			.then(req.flash("success", 'Email sent. '+dltUser.username+successMsg))
			.then(res.redirect("/dashboard/accounts"))
			.catch(error => console.log(error.message))
		}
	});
	
	//Remove Users listing
	listing.remove( { "author.id": req.params.id } ).populate('author.id').exec(function (err, dltListing) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from listing: ', dltListing);
		}
	});
	//Remove Users reviews
	Review.remove( { "author.id": req.params.id } ).populate('author.id').exec(function (err, dltReview) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from reviews: ', dltReview);
		}
	});
	//Remove Users comments
	Comment.remove( { "author.id": req.params.id } ).populate('author.id').exec(function (err, dltComment) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from comments: ', dltComment);
		}
	});
});

// follow/unfollow user
// router.get('/follow/:id', middleware.isLoggedIn, async function(req, res) {
//   try {
// 		let user = await User.findById(req.params.id);
// 		var foundUserFollower = user.followers.some(function (followers) {
// 			return followers.equals(req.user._id);
// 		});
// 		if(foundUserFollower){
			
// 			req.flash('success', 'You unfollowed ' + user.username + '.');
// 			res.redirect("back");
// 		} else{
// 			user.followers.push(req.user._id);
// 			user.save();
// 			req.flash('success', 'You are now following ' + user.username + '.');
// 			res.redirect('/user/' + req.params.id);
// 		}
//   } catch(err) {
//     req.flash('error', err.message);
//     res.redirect('back');
//   }
// });
router.post('/followSingle/:id', middleware.isLoggedIn, async function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if(err) {
			console.log(err)
			return res.redirect('back');
		}
		var foundUserFollower = foundUser.followers.some(function (followers) {
			return followers.equals(req.user._id);
		});
		var successMsg="";
		if(foundUserFollower) {
			foundUser.followers.pull(req.user._id)
			successMsg = 'You unfollowed ' + foundUser.username + '.';
		}else {
			foundUser.followers.push(req.user._id);
			successMsg = 'You are now following ' + foundUser.username + '.';
		}
		foundUser.save(function(err) {
			if (err) {
				req.flash('error', err.message);
				res.redirect('back');			
			}
			req.flash('success', successMsg);
 			res.redirect('/user/' + req.params.id);
		})
	})
  });

//modal form follow
router.post('/followAny/:id', middleware.isLoggedIn, async function(req, res) {
	User.findById(req.params.id, function(err, foundUser) {
		if(err) {
			console.log(err)
			return res.redirect('back');
		}
		var foundUserFollower = foundUser.followers.some(function (followers) {
			return followers.equals(req.user._id);
		});
		var successMsg="";
		if(foundUserFollower) {
			foundUser.followers.pull(req.user._id)
			successMsg = 'You unfollowed ' + foundUser.username + '.';
		}else {
			foundUser.followers.push(req.user._id);
			successMsg = 'You are now following ' + foundUser.username + '.';
		}
		foundUser.save(function(err) {
			if (err) {
				req.flash('error', err.message);
				res.redirect('back');			
			}
			req.flash('success', successMsg);
 			res.redirect('/user/' + req.params.id);
		})
	})
  });
// handle notification
router.get('/notifications/:id', middleware.isLoggedIn, async function(req, res) {
  try {
		let user = await User.findById(req.user._id);
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/listings/${notification.listingId}`);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

router.get('/users/:userId', async function(req, res) {
	const userId = req.params.userId
	try {
		const user = await User.findById(userId)
		res.status(200).json(user);
		// console.log(user)
	  } catch (err) {
		res.status(500).json(err);
	  }
});

//suspend/unsuspend account
router.put("/suspend/:id", middleware.isAdmin, function(req, res){
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, suspendUser){
		if(err){
			console.log(err)
			return res.redirect('back');
		} else{
			//Handling
			var successMsg = "";
			var choiceSus = JSON.parse(req.body.user.suspend);
			var suspendOption = "";
			if(choiceSus == true) {
				successMsg = " has been suspended."
				suspendOption = " SUSPENDED."
			}else {
				successMsg = " has been unsuspended."
				suspendOption = " UNSUSPENDED."
			}
			//Email
			async function sendMail() {
				try {
					const accessToken = await oAuth2Client.getAccessToken()

					const transport = nodemailer.createTransport({
						service: 'gmail',
						auth: {
							type: 'OAuth2',
							user: 'jptestingsku@gmail.com',
							clientId: CLIENT_ID,
							clientSecret: CLIENT_SECRET,
							refreshToken: REFRESH_TOKEN,
							accessToken: accessToken
						}
					});

					const mailOptions = {
						from: '3D Property Website <jptestingsku@gmail.com>',
						to: suspendUser.email,
						subject: 'Account suspension',
						html : "Hello <strong>" + suspendUser.username + "</strong>,<br><br>Your account has been "+suspendOption+"<br><br>"
					};

					const result = await transport.sendMail(mailOptions);
					return result; 
				}catch (error) {
					return error;
				}
			}
			sendMail()
			.then(result => console.log('Suspension Email Sent...', result))
			.then(req.flash("success", 'Email sent. '+suspendUser.username+successMsg))
			.then(res.redirect("/user/" + req.params.id))
			.catch(error => console.log(error.message))
		}
	});
});
// router.post('/suspend/:id', middleware.isLoggedIn, async function(req, res) {
// 	User.findById(req.params.id, function(err, suspendUser) {
// 		if(err) {
// 			req.flash("error", err.message);
// 			return res.redirect("back");
// 		}
// 		if(suspendUser.suspend == false) {
// 			suspendUser.suspend = true;
// 			req.flash('success',suspendUser.username+' is now suspended.');
// 		}else {
// 			suspendUser.suspend = false;
// 			req.flash('success','Removed suspension on '+suspendUser.username+'.');
// 		}
// 		res.redirect('/user/' + req.params.id);
// 	})
// });
// router.post('/unsuspend/:id', middleware.isLoggedIn, async function(req, res) {
// 	User.findOneAndUpdate({ _id: req.params.id }, {$set: {suspend: true}}, function(err, suspendUser) {
// 		if(err) {
// 			req.flash("error", err.message);
// 			return res.redirect("back");
// 		}
// 		req.flash('success',suspendUser.username+' suspended.');
// 		res.redirect("/login")
// 	})
// });

//Put Route - Reject agent account, set account to seeker account
router.put("/rejectAgent/:id", middleware.isAdmin, function(req, res){
	//can straight away use req.body.listing without having to define due to "listing[]" in the form name attributes
		User.findByIdAndUpdate(req.params.id, req.body.user, function(err, rejectedUser){
			if(err){
				res.redirect("/listings");
			} else{
				//Handling
				var successMsg = " has been rejected.";
				var choiceAgent = JSON.parse(req.body.user.isAgent)
				//Email
				async function sendMail() {
					try {
						const accessToken = await oAuth2Client.getAccessToken()
	
						const transport = nodemailer.createTransport({
							service: 'gmail',
							auth: {
								type: 'OAuth2',
								user: 'jptestingsku@gmail.com',
								clientId: CLIENT_ID,
								clientSecret: CLIENT_SECRET,
								refreshToken: REFRESH_TOKEN,
								accessToken: accessToken
							}
						});
	
						const mailOptions = {
							from: '3D Property Website <jptestingsku@gmail.com>',
							to: rejectedUser.email,
							subject: 'Agent Account Rejected',
							html : "Hello <strong>" + rejectedUser.username + "</strong>,<br><br>Your agent account has been REJECTED.<br><br>"
						};
	
						const result = await transport.sendMail(mailOptions);
						return result; 
					}catch (error) {
						return error;
					}
				}
				sendMail()
				.then(result => console.log('Suspension Email Sent...', result))
				.then(req.flash("success", 'Email sent. '+rejectedUser.username+successMsg))
				.then(res.redirect("/user/" + req.params.id))
				.catch(error => console.log(error.message))
			}
		});
	});

//Edit email Route from edit account
router.get("/user/:id/editEmail", middleware.checkUserOwnership, function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/user");
		} else{
			res.render("editEmail.ejs", {user: foundUser});
		}
	});
});
//Edit email
router.put("/user/:id/editEmail", middleware.checkUserOwnership, function(req, res){
	if(req.body.email != req.body.confirmEmail) {
		req.flash("error", "Email does not match. Please try again.");
		return res.redirect('back');
	}
	User.findByIdAndUpdate(req.params.id, { email: req.body.email }, function(err, foundUser){
		if(err){
			res.redirect("/user");
		} else{
			req.flash("success", "Email Updated.");
			res.redirect('/user/'+foundUser._id);
		}
	});
});
module.exports = router;