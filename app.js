if (process.env.NODE_ENV !== "production") {
	require('dotenv').config();
}

var express = require("express");
const countapi = require('countapi-js');
var app= express();
var server = require('http').createServer(app);
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
const moment = require('moment-timezone'); 
var passport = require("passport");
var localStrategy = require('passport-local').Strategy;
var passportLocalMongoose = require("passport-local-mongoose");
var flash = require("connect-flash");
var cors = require('cors');

var io = require('socket.io')(server);
app.use(cors());

var listing = require("./models/listing");
var Comment = require("./models/comment");	
var User = require("./models/user");

var commentRoutes = require('./routes/comments');
var listingRoutes = require('./routes/listings');
var indexRoutes = require('./routes/index');
var userRoutes = require('./routes/users');
var reviewRoutes = require("./routes/reviews");
var conversationRoutes = require("./routes/conversations")
var messageRoutes = require("./routes/messages")

//mongodb+srv://admin:admin@sap-dit3a87.airjg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
// mongoose.connect(process.env.DB_URL || "mongodb://localhost/SAP", {  
mongoose.connect("mongodb+srv://admin:admin@sap-dit3a87.airjg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {  
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

const path = require('path');

if (process.env.NODE_ENV == "production" ){
	app.use('/chat',express.static(path.join(__dirname,'/chat/client/build')));


app.get('/chat/*', (req, res) => {
    res.sendFile(path.join(__dirname,"chat/client/public/index.html"));
  });
}


//use & run express session
app.use(require("express-session")({
	secret: process.env.SECRET || "thls secret key ls very secret",
	resave: false,
	saveUninitialized: false
}));
//initialize passport
app.use(passport.initialize());
//run passport session
app.use(passport.session());
passport.use(User.createStrategy());
//responsible for reading the sessions - encoding & uncoding sessions
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req, res, next){
	res.locals.currentUser = req.user;
	if(req.user) {
	 try {
		 let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
		 res.locals.notifications = user.notifications.reverse();
	 } catch(err) {
		 console.log(err.message);
	 }
	}
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use(indexRoutes);
app.use(commentRoutes);
app.use(listingRoutes);
app.use(userRoutes);
app.use(reviewRoutes);
app.use(conversationRoutes);
app.use(messageRoutes);

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  //when ceonnect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    io.to(user.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

server.listen(process.env.PORT || 3000, process.env.IP, function() { 
	console.log('Server Has Started!'); 
});