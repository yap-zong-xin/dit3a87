var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var User = require("../models/user");
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
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'yappy', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//Dashboard for Main Get Route
router.get("/dashboard", function(req,res){
	res.render("dashboards/admin/index.ejs");
});

//Dashboard for Agent Application Get Route
router.get("/dashboard/agents", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("dashboards/admin/agentApplication/index.ejs", {users:allUsers});
		}
	});
});

//Dashboard for Agent Application Update Route
router.put("/dashboard/agents/:id", function(req, res){
	//can straight away use req.body.listing without having to define due to "listing[]" in the form name attributes
		User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
			if(err){
				res.redirect("/listings");
			} else{
				req.flash("success", "You have succesfully updated the agent status.")
				res.redirect("/user/" + req.params.id);
			}
		});
	});

//Dashboard for Manage Accounts Get Route
router.get("/dashboard/accounts", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("dashboards/admin/manageAccount.ejs", {users:allUsers});
		}
	});
});

// router.get("/dashboard/listings", function(req,res){
// 	listing.find({}, function(err, alllistings){
// 		if(err){
// 			console.log(err);
// 		} else{
// 			res.render("dashboards/admin/manageListings.ejs", {listings:alllistings});
// 		}
// 	});
// });

//Dashboard for Manage Listings Get Route
router.get("/dashboard/listings", function(req,res){
	listing.find({}).populate("comments likes").exec(function(err, foundlisting){
		if(err){
			console.log(err);
		} else{
		
			// var obj = {listings:foundlisting}
			// var lengthObj = {listings:foundlisting.length}
			// var max = Object.values(lengthObj)[0];
			// var arrStr = [];
			// var idArr = [];

			// //create array and loop through all listings to get ID
			// for (var i = 0; i < max ; i++) {
			// 	var idObj = {listings:foundlisting[i]._id}
			// 	var id = Object.values(idObj)[0];
			// 	idArr[i] = id;
			// }

			// async function getShow(url) {
			// 	var result;
			// 	result = await countApi("/get/3dpropertylistingsg/" + url)
			// 	.then(success => {
			// 		return success.data.value;
			// 	})
			// 	return result;
			// }
			
			// async function getShow2(url) {
			// 	var result;
			// 	result = await countApi("/get/3dpropertylistingsg/" + url + "-click")
			// 	.then(success => {
			// 		return success.data.value;
			// 	})
			// 	return result;
			// }

			// async function clickRateCalc() {
			// 	idArr.forEach(async function(url, i) {
			// 		var e = await getShow(url)
			// 		var f = await getShow2(url)
			// 		var rateArr = [url,e,f];
			// 		arrStr.push(rateArr);
			// 		if(arrStr.length == idArr.length) {
			// 			//calculate clickrate
			// 			arrStr.forEach(function(item, i) {
			// 				var id = arrStr[i][0];
			// 				var clickCount = arrStr[i][1];
			// 				var shownCount = arrStr[i][2]
			// 				var clickRateStr = Math.round((clickCount/shownCount) * 100) + "%";

			// 				var obj = {
			// 					"id" : id,
			// 					"click" : clickCount,
			// 					"shown" : shownCount,
			// 					"clickRate" : clickRateStr
			// 				}

			// 				console.log(obj)
			// 			})
			// 			console.log("done")
			// 		}
			// 	});
			// }

			// clickRateCalc();
				
			res.render("dashboards/admin/manageListings.ejs", {listings:foundlisting});
			// res.render("dashboards/admin/manageListings.ejs", {listings:foundlisting, getClickRate:getClickRate});
		}
	});
});

//Profile
//Get Route
router.get("/user", function(req,res){
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		//search the different types (name/time/date)
		User.find({$or: [{username: regex}, {firstName: regex}, {lastName: regex}]}, function(err, allUsers){
			if(err){
				console.log(err);
			} else {
				if(allUsers.length < 1) {
					noMatch = "No agent match that query, please try again.";
				}
				res.render("users/index.ejs", {users: allUsers, noMatch: noMatch});
			}
		});	
	} else {
		User.find({}, function(err, allUsers){
			if(err){
				console.log(err);
			} else{
				res.render("users/index.ejs", {users:allUsers, noMatch: noMatch});
			}
		});
	}
});

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Show Route
router.get("/user/:id", function (req, res) {
	var noMatch = null;
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
							res.render("users/show.ejs", {user: foundUser, listings: alllistings, allNotifications, allFollowers, noMatch: noMatch});
						}
					});
				} else {
					listing.find().where('author.id').equals(foundUser._id).exec(function(err, listings) {
						if(err) {
							req.flash("error", "Something went wrong. Please try again.");
							return res.redirect("/");
						}
						// foundUser.notifications.image = foundUser.image
						res.render("users/show.ejs", {user: foundUser, listings: listings, allNotifications, allFollowers, noMatch: noMatch});
					});
				}
			}
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

//Edit Route
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
router.put("/user/:id", middleware.checkUserOwnership, upload.single("image"), function(req, res){
	User.findById(req.params.id, async function(err, user){
		console.log(user)
		console.log(user.reviews)
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
  User.findById(req.params.id, async function(err, user) {
		console.log(user)
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
			Review.remove({"_id": {$in: user.reviews}}, async function (err) {
				if (err) {
					console.log(err);
					return res.redirect("/listings");
				}
        await cloudinary.v2.uploader.destroy(user.imageId);
        user.remove();
        req.flash('success', 'You have successfully deleted the user.');
        res.redirect('/listings');
			});
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

// follow user
router.get('/follow/:id', middleware.isLoggedIn, async function(req, res) {
  try {
		let user = await User.findById(req.params.id);
		var foundUserFollower = user.followers.some(function (followers) {
			return followers.equals(req.user._id);
		});
		if(foundUserFollower){
			req.flash("error","You are already following " + user.username + '.');
			res.redirect("back");
		} else{
			user.followers.push(req.user._id);
			user.save();
			req.flash('success', 'You are now following ' + user.username + '.');
			res.redirect('/user/' + req.params.id);
		}
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
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

module.exports = router;