var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var User = require("../models/user");
var listing = require("../models/listing");

//ADMIN DASHBOARD
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

//AGENTS
//Get Route
router.get("/agent", function(req,res){
	User.find({}, function(err, allUsers){
		if(err){
			console.log(err);
		} else{
			res.render("users/agent.ejs", {users:allUsers});
		}
	});
});

//Show Route
router.get("/agent/:id", function (req, res) {
	//find the user with provided ID
	User.findById(req.params.id).populate("comments").populate({
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
router.get("/agent/:id/edit", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("/agent");
		} else{
			res.render("users/edit.ejs", {user: foundUser});
		}
	});
});

//Update Route
router.put("/agent/:id", function(req, res){
	//can straight away use req.body.campground without having to define due to "campground[]" in the form name attributes
	User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
		if(err){
			res.redirect("/agent");
		} else{
			res.redirect("/agent/" + req.params.id);
		}
	});
});

module.exports = router;