var express = require('express');
var router = express.Router();
var User = require('../models/user');
var listing = require('../models/listing');
var passport = require("passport");
var middleware = require('../middleware');
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

//Register Route
router.get("/register", middleware.notLoggedIn, function(req, res){
	res.render("register.ejs");
});
router.get("/register-admin", middleware.notLoggedIn, function(req, res){
	res.render("registerAdmin.ejs");
});
router.post("/register", middleware.notLoggedIn, upload.single('image'), function(req, res){
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

	cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
		// add cloudinary url for the image to the listing object under image property
		req.body.image = result.secure_url;
		newUser.image = req.body.image
		// add image's public_id to listing object
		req.body.imageId = result.public_id;
		newUser.imageId = req.body.imageId
		
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