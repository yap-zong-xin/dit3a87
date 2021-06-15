const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
	isVerified : {type: Boolean, default: false},
	verificationCode: {type: String, default: ''},
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

module.exports = mongoose.model("User", userSchema);