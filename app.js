if (process.env.NODE_ENV !== "production") {
	require('dotenv').config();
}

var express = require("express");
var app= express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
const moment = require('moment-timezone'); 
var passport = require("passport");
var localStrategy = require('passport-local').Strategy;
var passportLocalMongoose = require("passport-local-mongoose");
var flash = require("connect-flash");

var listing = require("./models/listing");
var Comment = require("./models/comment");
var User = require("./models/user");

var commentRoutes = require('./routes/comments');
var listingRoutes = require('./routes/listings');
var indexRoutes = require('./routes/index');
var userRoutes = require('./routes/users');
var reviewRoutes = require("./routes/reviews");

mongoose.connect("mongodb://localhost/SAP", {  
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false 
});

app.locals.moment = require('moment');
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());

//use & run express session
app.use(require("express-session")({
	secret: "thls secret key ls very secret",
	resave: false,
	saveUninitialized: false
}));
//initialize passport
app.use(passport.initialize());
//run passport session
app.use(passport.session());
passport.use(User.createStrategy());
passport.use(new localStrategy({
	usernameField: 'email', // this is where you do that
	passwordField: 'password'
},
(email, password, done) => {
	User.findOne({
			email: email
	}, (error, user) => {
			if (error) {
					return done(error);
			}
			if (!user) {
					return done(null, false, {
							message: 'Username or password incorrect'
					});
			}
			// Do other validation/check if any
			return done(null, user);
	});
}
));
//responsible for reading the sessions - encoding & uncoding sessions
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use(indexRoutes);
app.use(commentRoutes);
app.use(listingRoutes);
app.use(userRoutes);
app.use(reviewRoutes);

app.listen(process.env.PORT || 3000, process.env.IP, function() { 
	console.log('Server Has Started!'); 
});