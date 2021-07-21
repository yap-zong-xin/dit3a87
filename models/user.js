var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
const listing = require('./listing');
const Comment = require('./comment');

var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	email: String,
	phone: Number,
	cea: String,
	image: String,
	imageId: String,
	banner: String,
	bannerId: String,
	firstName: String,
	lastName: String,
	gender: String,
	streetName: String,
	unitNumber: String,
	country: String,
	state: String,
	postalCode: Number,
	isAdmin: {type: Boolean, default: false},
	isAgent: {type: Boolean, default: false},
	agentStatus: {type: Boolean, default: false},
	isVerified : {type: Boolean, default: false},
	verificationCode: {type: String, default: ''},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	lastLogin: { type: Date, default: Date.now },
	suspend: {type: Boolean, default: false},
	reviews: [
		{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Review"
		}
	],
	rating: {
			type: Number,
			default: 0
	},
	notifications: [
		{
			 type: mongoose.Schema.Types.ObjectId,
			 ref: 'Notification'
		}
	],
	followers: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	],
	createdAt: { type: Date, default: Date.now }
});

userSchema.pre('remove', async function(next) {
  try {
      await listing.remove({ 'author.id': this._id });
      await Comment.remove({ 'author.id': this._id });
      next();
  } catch (err) {
      console.log(err);
  }
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);