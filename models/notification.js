var mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema({
	username: String,
	listingId: String,
	idUser: String,
	image: String,
	listingImage: String,
	isRead: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);