var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	email: String,
	phone: Number,
	cea: String,
	image: String,
	imageId: String,
	firstName: String,
	lastName: String,
	isAdmin: {type: Boolean, default: false},
	isAgent: {type: Boolean, default: false},
	agentStatus: {type: Boolean, default: false},
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
	createdAt: { type: Date, default: Date.now }
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("User", userSchema);