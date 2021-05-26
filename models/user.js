var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: String,
	password: String,
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
	}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);