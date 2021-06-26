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
const CLIENT_ID = '476773105287-ojgudstsf7bv4rvb572b7pequt1ng6r2.apps.googleusercontent.com';
const CLIENT_SECRET = 'l7vmthxIvR0r4cAdCAl3oC_R';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04cfP4D4yBv7hCgYIARAAGAQSNwF-L9IrXQZe6ioFhiEfJOjHq34eHsvkK7I1TgqugbVazQXNy84LuKVToaMZqInSToGwk7P8YTg';

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
			// add image's public_id to listing object
			req.body.imageId = result.public_id;
			
			newUser.banner = "https://www.manpower.com.au/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBdnBaIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--7a3834c4cf7a3b0dc9e55ecad8a24d057f331f25/img-placeholder.jpg";
			
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
							from: 'Property Company <jptestingsku@gmail.com>',
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
				.then(req.flash('success','You have successfully created an account. Please verify your email.'))
				.then(res.redirect("/login"))
				.catch(error => console.log('email error: ',error.message))
				
			});
		});
	} else if(!req.file && req.body.roleCode != 'agent') {
		newUser.image = "https://i.pinimg.com/originals/8b/db/8e/8bdb8e8a536946dbe616ee509b7fb435.jpg";
		newUser.banner = "https://www.manpower.com.au/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBdnBaIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--7a3834c4cf7a3b0dc9e55ecad8a24d057f331f25/img-placeholder.jpg";
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
						from: 'Property Company <jptestingsku@gmail.com>',
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
			.then(req.flash('success','You have successfully created an account. Please verify your email.'))
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
			req.flash("error", "Account with the email is not found. Please try again.")
			return res.redirect("/login");
		}else{
			User.find({ email: inputEmail }, {"_id": 0, "isVerified": 1}, function(err, verified) {
				if(err) {
					return console.error(err);
				}
				//console.log(verified[0].isVerified);
				if(!verified[0].isVerified) { 
					req.flash("error", "Account with the email is not verified. Please verify using the link send to your email.")
					res.redirect("/login");
				}else {
					passport.authenticate("local",
					{
						successRedirect: "/listings",
						failureRedirect: "/login",
						failureFlash: true,
						successFlash: "You are successfully logged in. Welcome to 3D Property Website."
					})(req, res);
				}
			});
		}
	})
});

// forgot password
router.get('/forgot', function(req, res) {
	res.render('forgot.ejs');
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
		});

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
				from: 'Property Company <jptestingsku@gmail.com>',
				to: req.body.email,
				subject: 'Password Reset',
				html : "You are receiving this because you (or someone else) have requested the reset of the password for your account. " +
				 	   "<br><a href="+link+">Click here to proceed</a>"
			};

			const result = await transport.sendMail(mailOptions);
			return result; 
		}catch (error) {
			return error;
		}
	}

	senMail()
	.then(result => console.log('Email Sent...', result))
	.then(req.flash('success','An e-mail has been sent to ' + req.body.email +' with further instructions.'))
	.then(res.redirect('back'))
	.catch(error => console.log(error.message))

	
		// var smtpTransport = nodemailer.createTransport({
		//   service: 'Gmail', 
		//   auth: {
		// 	user: 'learntocodeinfo@gmail.com',
		// 	pass: process.env.GMAILPW
		//   }
		// });
		// var mailOptions = {
		//   to: user.email,
		//   from: 'learntocodeinfo@gmail.com',
		//   subject: 'Node.js Password Reset',
		//   text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
		// 	'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
		// 	'http://' + req.headers.host + '/reset/' + token + '\n\n' +
		// 	'If you did not request this, please ignore this email and your password will remain unchanged.\n'
		// };
		// smtpTransport.sendMail(mailOptions, function(err) {
		//   console.log('mail sent');
		//   req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
		//   done(err, 'done');
		// });
	//   }

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
			  res.redirect('/login');
			})
		  } else {
			  req.flash("error", "Passwords do not match.");
			  return res.redirect('back');
		  }
		});

		// async function senMail(user){

		// 	try {
	
		// 		const accessToken = await oAuth2Client.getAccessToken()
	
		// 		const transport = nodemailer.createTransport({
		// 			service: 'gmail',
		// 			auth: {
		// 				type: 'OAuth2',
		// 				user: 'jptestingsku@gmail.com',
		// 				clientId: CLIENT_ID,
		// 				clientSecret: CLIENT_SECRET,
		// 				refreshToken: REFRESH_TOKEN,
		// 				accessToken: accessToken
		// 			}
		// 		});
	
		// 		const mailOptions = {
		// 			from: 'Property Company <jptestingsku@gmail.com>',
		// 			to: user.email,
		// 			subject: 'Password Reset',
		// 			html : 'Hello,\n\n' +
		// 					'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
		// 		};
	
		// 		const result = await transport.sendMail(mailOptions);
		// 		return result; 
		// 	}catch (error) {
		// 		return error;
		// 	}
		// }
	
		// senMail()
		// .then(result => console.log('Email Sent...', result))
		// .then(req.flash('success','Success! Your password has been changed.'))
		// .catch(error => console.log(error.message))

	//   function sendMail(user, done) {
	// 	var smtpTransport = nodemailer.createTransport({
	// 	  service: 'Gmail', 
	// 	  auth: {
	// 		user: 'learntocodeinfo@gmail.com',
	// 		pass: process.env.GMAILPW
	// 	  }
	// 	});
	// 	var mailOptions = {
	// 	  to: user.email,
	// 	  from: 'learntocodeinfo@mail.com',
	// 	  subject: 'Your password has been changed',
	// 	  text: 'Hello,\n\n' +
	// 		'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
	// 	};
	// 	smtpTransport.sendMail(mailOptions, function(err) {
	// 	  req.flash('success', 'Success! Your password has been changed.');
	// 	  done(err);
	// 	});
	//   }

  });
  


//Logout Route
router.get("/logout", middleware.isLoggedIn, function(req, res){
	req.logout();
	req.flash("success", "You have been successfully logged out.");
	res.redirect("/login");
});

module.exports = router;