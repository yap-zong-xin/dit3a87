var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require("passport");
var middleware = require('../middleware');

//Register Route
router.get("/register", middleware.notLoggedIn, function(req, res){
	res.render("register.ejs");
});
router.get("/register-agent", middleware.notLoggedIn, function(req, res){
	res.render("registerAgent.ejs");
});
router.post("/register", middleware.notLoggedIn, function(req, res){
	var newUser = new User({username: req.body.username, email: req.body.email});
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

module.exports = router;