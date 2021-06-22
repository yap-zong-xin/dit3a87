var mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema({
	username: String,
	listingId: String,
	image: String,
	isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model("Notification", notificationSchema);