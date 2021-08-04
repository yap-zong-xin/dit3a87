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
const user = require('../models/user');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

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
			gender: req.body.gender,
			cea: req.body.cea,
			streetName: req.body.streetName,
			unitNumber: req.body.unitNumber,
			country: req.body.country,
			state: req.body.state,
			postalCode: req.body.postalCode,
			verificationCode: randomStringCode,
	});
	if(req.body.roleCode === 'admin'){
		newUser.isAdmin = true;
	} else if(req.body.roleCode === 'agent'){
		newUser.isAgent = true;
	}
	if(req.file){
		cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
			// add cloudinary url for the image to the listing object under image property
			req.body.image = result.secure_url;
			newUser.image = req.body.image
			newUser.imageId = result.public_id;
			// add image's public_id to listing object
			req.body.imageId = result.public_id;
			
			newUser.banner = "https://www.phdmedia.com/germany/wp-content/uploads/sites/28/2017/06/Banner-2.gif";
			
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
							from: '3D Property Website <jptestingsku@gmail.com>',
							to: newUser.email,
							subject: 'Account Verification',
							html : "Hello <strong>" + newUser.username + "</strong>,<br><br>Thank you for registering. Please click on the link below to verify your account.<br><br><a href="+link+">Verify Account</a>"
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
				.then(req.flash('success','A link has been sent to your email. Please verify your account.'))
				.then(res.redirect("/login"))
				.catch(error => console.log('email error: ',error.message))
				
			});
		});
	} else if(!req.file && req.body.roleCode != 'agent') {
		newUser.image = "https://www.happitime.co.uk/images/uploads/profile.jpg";
		newUser.banner = "https://www.phdmedia.com/germany/wp-content/uploads/sites/28/2017/06/Banner-2.gif";
		User.register(newUser, req.body.password, function(err, user){
			if(err){
				console.log(err);
				req.flash('error', err.message);
				return res.redirect('/register');
			}
			console.log(newUser.image)
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
						from: '3D Property Website <jptestingsku@gmail.com>',
						to: newUser.email,
						subject: 'Account Verification',
						html : "Hello <strong>" + newUser.username + "</strong>,<br><br>Thank you for registering. Please click on the link below to verify your account.<br><br><a href="+link+">Verify Account</a>"
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
			.then(req.flash('success','A link has been sent to your email. Please verify your account.'))
			.then(res.redirect("/login"))
			.catch(error => console.log(error.message))
		});
	} else {
		req.flash('error', 'You need to upload an image.');
		return res.redirect('/register');
	}
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
			req.flash('success','Your account has been successfully approved. You can now login to your account.');
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

	User.find({ email: inputEmail }, function(err, existUser) {
		if(existUser.length === 0 || err) {
			req.flash("error", "Account cannot be found. Please try again.")
			return res.redirect("/login");
		}else{
			User.find({ email: inputEmail }, function(err, existUser) {
				if(err) {
					return console.error(err);
				}
				console.log(existUser);
				if(!existUser[0].isVerified) { 
					req.flash("error", "Account is not verified. Please verify using the link sent to your email.")
					res.redirect("/login");
				}else if(existUser[0].suspend) {
					req.flash("error", "Account is suspended.")
					res.redirect("/login");
				}else {
					User.findOneAndUpdate({email:inputEmail}, {$set: {lastLogin: Date.now() }}, function(err, updatedUser) {
						if(err) {
							console.log(err)
						}
					})
					passport.authenticate("local",
					{
						successRedirect: "/listings",
						failureRedirect: "/login",
						failureFlash: true,
						successFlash: "You have logged in successfully. Welcome to 3D Property Website."
					})(req, res);
				}
			});
		}
	})
});

router.post('/forgot', function(req, res, next) {
	function tokenCode (size = 20) {
		return crypto
			.randomBytes(size)
			.toString('hex') //hex for url safe string as base64 may contain forward slash
			.slice(0, size)
	}
	var resetPwToken = tokenCode();

	User.findOne({ email: req.body.email }, function(err, user) {
		if (!user) {
			req.flash('error', 'No account with that email address exists.');
			return res.redirect('/forgot');
		}
		user.resetPasswordToken = resetPwToken;
		user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
		user.save();
		async function senMail(){
			try {
				var host = req.get('host');
				var link = 'http://'+host+"/reset/"+resetPwToken;
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
					from: '3D Property Website <jptestingsku@gmail.com>',
					to: req.body.email,
					subject: 'Password Reset',
					html : "Hello "+user.username+",<br><br>You are receiving this email because you (or someone else) have requested the reset of the password for your account." +
								"<br><br><a href="+link+">Reset Password</a>"
				};
				const result = await transport.sendMail(mailOptions);
					return result; 
			} catch (error) {
				return error;
			}
		}
	
		senMail()
		.then(result => console.log('Email Sent...', result))
		.then(req.flash('success','An e-mail has been sent to ' + req.body.email +' with further instructions.'))
		.then(res.redirect('back'))
		.catch(error => console.log(error.message))
	});
});
  
router.get('/reset/:token', function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (!user) {
		req.flash('error', 'Password reset token is invalid or has expired.');
		return res.redirect('/login');
		}
		res.render('reset.ejs', {token: req.params.token});
	});
});
  
router.post('/reset/:token', function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (!user) {
		req.flash('error', 'Password reset token is invalid or has expired.');
		return res.redirect('back');
		}
		if(req.body.password === req.body.confirm) {
		user.setPassword(req.body.password, function(err) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;

			user.save();
			req.flash("success", "Success! Your password has been changed.");
			res.redirect('/user/'+user._id);
		})
		} else {
			req.flash("error", "Passwords do not match.");
			return res.redirect('back');
		}
	});
});

//Logout Route
router.get("/logout", middleware.isLoggedIn, function(req, res){
	req.logout();
	req.flash("success", "You have logged out successfully.");
	res.redirect("/login");
});

//About Route
router.get("/service", function(req, res){
	res.render("service.ejs");
});

//About Route
router.get("/connect", function(req, res){
	res.render("connect.ejs");
});

// Contact Us Form
router.post("/connect", function(req, res){
	async function senMail(){
		try {
			const text = req.body.emailText
			const phone = req.body.phone
			const email = req.body.email
			const firstName = req.body.firstName
			const lastName = req.body.lastName
			const subject = req.body.subject
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
				to: "avk03.19@ichat.sp.edu.sg,dereckzorca.18@ichat.sp.edu.sg,jingpng18.18@ichat.sp.edu.sg,yapzx.19@ichat.sp.edu.sg,ahkc.19@ichat.sp.edu.sg",
				subject: subject,
				html :'<strong>User Details</strong><br>Name: ' + firstName + " " + lastName + "<br>"
						+ "Phone: " + phone + "<br>"
						+ "Email: " + email + "<br><br>"
						+ "<strong>User Message</strong><br>"
						+ text
			};
			const result = await transport.sendMail(mailOptions);
				return result; 
		} catch (error) {
			return error;
		}
	}

	senMail()
	.then(result => console.log('Email Sent...', result))
	.then(req.flash('success','Your Email has been sent!'))
	.then(res.redirect('back'))
	.catch(error => console.log(error.message))
});


module.exports = router;