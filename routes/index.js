var express = require('express');
var router = express.Router();
var User = require('../models/user');
var listing = require('../models/listing');
var passport = require("passport");
var middleware = require('../middleware');

//Register Route
router.get("/register", middleware.notLoggedIn, function(req, res){
	res.render("register.ejs");
});
router.get("/register-admin", middleware.notLoggedIn, function(req, res){
	res.render("registerAdmin.ejs");
});
router.post("/register", middleware.notLoggedIn, function(req, res){
	var newUser = new User({
			username: req.body.username, 
			email: req.body.email, 
			firstName: req.body.firstName, 
			lastName: req.body.lastName,
			avatar: req.body.avatar,
			phone: req.body.phone,
			cea: req.body.cea,
	});
	if(req.body.roleCode === 'admin'){
		newUser.isAdmin = true;
	} else if(req.body.roleCode === 'agent'){
		newUser.isAgent = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			req.flash('error', err.message);
			return res.redirect('/register');
		}
		//once the user is created successfully, this code will log the user in & take care of everything in the session (store information/run serialize user method)
		passport.authenticate("local")(req, res, function(){
			req.flash('success','Your account was successfully created');
			res.redirect("/");
		});
	});
});

//Login Route
router.get("/login", middleware.notLoggedIn, function(req, res){
	res.render("login.ejs");
});
//middleware - passport.authenticate helps us to check if the username & password exist in the database
router.post("/login", middleware.notLoggedIn, function (req, res, next) {
  passport.authenticate("local",
    {
      successRedirect: "/listings",
      failureRedirect: "/login",
      failureFlash: true,
      successFlash: "Welcome to YelpCamp!"
    })(req, res);
});

//Logout Route
router.get("/logout", middleware.isLoggedIn, function(req, res){
	req.logout();
	req.flash("success", "You are logged out!");
	res.redirect("/login");
});

//Profile
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if(err) {
      req.flash("error", "Something went wrong.");
      return res.redirect("/");
    }
    listing.find().where('author.id').equals(foundUser._id).exec(function(err, listings) {
      if(err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
      }
      res.render("profile/show.ejs", {user: foundUser, listings: listings});
    })
  });
});

module.exports = router;