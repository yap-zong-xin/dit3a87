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

//npm install crypto-random-string
var crypto = require('crypto');

function randomCryptoString (size = 128) {
	return crypto
		.randomBytes(size)
		.toString('hex') //hex for url safe string as base64 may contain forward slash
		.slice(0, size)
}

//npm install nodemailer --save
var nodemailer = require("nodemailer");

//npm install googleapis
var { google } = require('googleapis');
const CLIENT_ID = '476773105287-ojgudstsf7bv4rvb572b7pequt1ng6r2.apps.googleusercontent.com';
const CLIENT_SECRET = '7tvnoTSjDIcBwgmYs5oUvE1R';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04Yr2cfowKOLQCgYIARAAGAQSNwF-L9IrIzQy0gn9q08Z_1VPYS_V_fGGJxx4wnX7sPzgw3WaX2MdrZGC_iXP58P1eNx0jXBiCq4';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

//Register Route
router.get("/register", middleware.notLoggedIn, function(req, res){
	res.render("register.ejs");
});
router.get("/register-admin", middleware.notLoggedIn, function(req, res){
	res.render("registerAdmin.ejs");
});
// router.post("/register", middleware.notLoggedIn, upload.single('image'), function(req, res){
// 	var newUser = new User({
// 			username: req.body.username, 
// 			email: req.body.email, 
// 			firstName: req.body.firstName, 
// 			lastName: req.body.lastName,
// 			avatar: req.body.avatar,
// 			phone: req.body.phone,
// 			cea: req.body.cea,
// 	});
// 	if(req.body.roleCode === 'admin'){
// 		newUser.isAdmin = true;
// 	} else if(req.body.roleCode === 'agent'){
// 		newUser.isAgent = true;
// 	}

// 	cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
// 		// add cloudinary url for the image to the listing object under image property
// 		req.body.image = result.secure_url;
// 		newUser.image = req.body.image
// 		// add image's public_id to listing object
// 		req.body.imageId = result.public_id;
// 		newUser.imageId = req.body.imageId
		
// 		User.register(newUser, req.body.password, function(err, user){
// 			if(err){
// 				console.log(err);
// 				req.flash('error', err.message);
// 				return res.redirect('/register');
// 			}
// 			//once the user is created successfully, this code will log the user in & take care of everything in the session (store information/run serialize user method)
// 			passport.authenticate("local")(req, res, function(){
// 				req.flash('success','Your account was successfully created');
// 				res.redirect("/");
// 			});
// 		});
// 	});
// });

router.post("/register", middleware.notLoggedIn, upload.single('image'), function(req, res){
	var randomStringCode = randomCryptoString();

	var newUser = new User({
			username: req.body.username, 
			email: req.body.email, 
			firstName: req.body.firstName, 
			lastName: req.body.lastName,
			avatar: req.body.avatar,
			phone: req.body.phone,
			cea: req.body.cea,
			verificationCode: randomStringCode,
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
			async function sendMail() {
				try {
					var host = req.get('host');
					var link = 'http://'+host+"/verify?id="+randomStringCode;
					console.log(link);

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
						from: 'YELP CAMP <jptestingsku@gmail.com>',
						to: newUser.email,
						subject: 'Email verification',
						html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
					};

					const result = await transport.sendMail(mailOptions);
					return result; 
				}catch (error) {
					return error;
				}
			}
			console.log('the randomStringCode: '+randomStringCode);
			sendMail()
			.then(result => console.log('Email Sent...', result))
			.then(req.flash('success','Your account was successfully created, please verify your email'))
			.then(res.redirect("/login"))
			.catch(error => console.log(error.message))
			
		});
	});
});

//Verify account route
router.get("/verify", middleware.notLoggedIn, function(req, res) {
	var id = req.query.id;
	console.log('got id anot: '+id);
	var existUser = User.findOne({ verificationCode: id });
	console.log('have user: '+existUser)
	if(existUser) {
		User.findOneAndUpdate({ verificationCode: id }, {$set: {isVerified: true, verificationCode: ""}}, function(err, updatedUser) {
			if(err) {
				req.flash("error", err.message);
            	return res.redirect("back");
			}
			console.log('updated n removed');
			req.flash('success','Account approved, please log in to your account.');
			res.redirect("/login")
			// passport.authenticate("local")(req, res, function(){
			// 	req.flash('success','Welcome!');
			// 	res.redirect("/listings");
			// });
		} );
	}
})

//Login Route
router.get("/login", middleware.notLoggedIn, function(req, res){
	res.render("login.ejs");
});
//middleware - passport.authenticate helps us to check if the username & password exist in the database
router.post("/login", middleware.notLoggedIn, function (req, res, next) {
	// Make sure the user has been verified
	var inputEmail = req.body.email;

	User.find({ email: inputEmail}, function(err, existUser) {
		if(existUser.length === 0 || err) {
			req.flash("error", "Account with email not found. Please sign up.")
			return res.redirect("/login");
		}else{
			User.find({ email: inputEmail }, {"_id": 0, "isVerified": 1}, function(err, verified) {
				if(err) {
					return console.error(err);
				}
				//console.log(verified[0].isVerified);
				if(!verified[0].isVerified) { 
					req.flash("error", "Account not verified! Please verify with link in your email.")
					res.redirect("/login");
				}else {
					passport.authenticate("local",
					{
					  successRedirect: "/listings",
					  failureRedirect: "/login",
					  failureFlash: true,
					  successFlash: "Welcome to YelpCamp!"
					})(req, res);
				}
			});
		}

	})
});

//Logout Route
router.get("/logout", middleware.isLoggedIn, function(req, res){
	req.logout();
	req.flash("success", "You are logged out!");
	res.redirect("/login");
});

module.exports = router;