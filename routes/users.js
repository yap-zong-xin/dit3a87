var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var User = require("../models/user");
var Review = require("../models/review");
var listing = require("../models/listing");
var Notification = require("../models/notification");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
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

//Dashboard
//Get Route
router.get("/admin-dashboard", function(req,res){
	res.render("dashboards/admin/index.ejs");
});

//Get Route
router.get("/admin-dashboard/agent", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("dashboards/admin/agent.ejs", {users:allUsers});
		}
	});
});

//Get Route
router.get("/admin-dashboard/public", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("dashboards/admin/public.ejs", {users:allUsers});
		}
	});
});

//Show Route
router.get("/admin-dashboard/agent/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/listings");
		} else{
			res.render("dashboards/admin/show.ejs", {user: foundUser});
		}
	});
});

//Edit Route
router.get("/admin-dashboard/agent/:id/edit", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/listings");
		} else{
			res.render("dashboards/admin/edit.ejs", {user: foundUser});
		}
	});
});

//Update Route
router.put("/admin-dashboard/agent/:id", function(req, res){
//can straight away use req.body.listing without having to define due to "listing[]" in the form name attributes
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
		if(err){
			res.redirect("/listings");
		} else{
			res.redirect("/admin-dashboard/agent/" + req.params.id);
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
	//find the user with provided ID
	User.findById(req.params.id).populate("comments followers").populate({
			path: "reviews",
			options: {sort: {createdAt: -1}}
	}).exec(function (err, foundUser) {
			if (err) {
				req.flash("error", "Something went wrong.");
				console.log(err);
			} else {
				listing.find().where('author.id').equals(foundUser._id).exec(function(err, listings) {
					if(err) {
						req.flash("error", "Something went wrong.");
						return res.redirect("/");
					}
					res.render("users/show.ejs", {user: foundUser, listings: listings});
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
		user.streetName = req.body.user.streetName;
		user.unitNumber = req.body.user.unitNumber;
		user.country = req.body.user.country;
		user.state = req.body.user.state;
		user.postalCode = req.body.user.postalCode;
		user.save();
		console.log(user)
		req.flash("success", "profile info successfully updated!");
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
        req.flash('success', 'listing deleted successfully!');
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
			req.flash("error","you already follow"+user.username + '!');
			res.redirect("back");
		} else{
			user.followers.push(req.user._id);
			user.save();
			req.flash('success', 'Successfully followed ' + user.username + '!');
			res.redirect('/user/' + req.params.id);
		}
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// view all notifications
router.get('/notifications', middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: { sort: { "_id": -1 } }
    }).exec();
    let allNotifications = user.notifications;
    res.render('notifications/index.ejs', { allNotifications });
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// handle notification
router.get('/notifications/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/listings/${notification.listingId}`);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

module.exports = router;