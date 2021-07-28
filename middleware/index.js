var middlewareObj = {};
var User = require('../models/user');
var listing = require('../models/listing');
var Comment = require("../models/comment");
var Review = require("../models/review");

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please login first.");
	res.redirect("/login");
}

middlewareObj.notLoggedIn = function(req, res, next){
	if(!req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You are already login.");
	res.redirect("/");
}

middlewareObj.isAdmin = function(req, res, next){
	if(req.isAuthenticated() && req.user.isAdmin){
		return next();
	} else {
		req.flash("error", "You are not an admin.");
		res.redirect("/listings");
	}
}

middlewareObj.isAdminAgent = function(req, res, next){
	if(req.isAuthenticated() && req.user.isAdmin && req.user.isAgent){
		return next();
	} else {
		req.flash("error", "You do not have permission to do that.");
		res.redirect("/listings");
	}
}

middlewareObj.checklistingOwnership = function(req, res, next){
	//is user logged in?
	if(req.isAuthenticated()){
		listing.findById(req.params.id, function(err, foundlisting){
			if(err){
				//redirect to the previous page they were on
				res.redirect("back");
			} else{
				//if is logged in, does the user own the listing?
				//check by comparing the listing author with user._id
				//cannot compare using '==' or '===' because one is an object and the other is a string (not same)
				if(foundlisting.author.id.equals(req.user._id) || req.user.isAdmin){
					//proceed with edit/delete
					next();
				} else{
					res.redirect("back");
				}
			}
		});
	} else{
		//redirect to the previous page they were on
		res.redirect("back");
	}
}

middlewareObj.checkCommentOwnership = function(req, res, next){
	//is user logged in?
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				//redirect to the previous page they were on
				res.redirect("back");
			} else{
				//if is logged in, does the user own the comment?
				//check by comparing the comment with user._id
				//cannot compare using '==' or '===' because one is an object and the other is a string (not same)
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
					//proceed with edit/delete
					next();
				} else{
					res.redirect("back");
				}
			}
		});
	} else{
		//redirect to the previous page they were on
		res.redirect("back");
	}
}

middlewareObj.checkReviewOwnership = function(req, res, next) {
	if(req.isAuthenticated()){
			Review.findById(req.params.review_id, function(err, foundReview){
					if(err || !foundReview){
							res.redirect("back");
					}  else {
							// does user own the comment?
							if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
									next();
							} else {
									req.flash("error", "You do not have permission to do that.");
									res.redirect("back");
							}
					}
			});
	} else {
			req.flash("error", "You need to be logged in to do that.");
			res.redirect("back");
	}
};

middlewareObj.checkReviewExistence = function (req, res, next) {
	if (req.isAuthenticated()) {
			User.findById(req.params.id).populate("reviews").exec(function (err, foundUser) {
					if (err || !foundUser) {
							req.flash("error", "The user cannot be found.");
							res.redirect("back");
					} else {
							// check if req.user._id exists in foundUser.reviews
							var foundUserReview = foundUser.reviews.some(function (review) {
									return review.author.id.equals(req.user._id);
							});
							if (foundUserReview) {
									req.flash("error", "You have posted a review for this agent already.");
									return res.redirect("/user/" + foundUser._id);
							}
							// if the review was not found, go to the next middleware
							next();
					}
			});
	} else {
			req.flash("error", "You need to be logged in to do that.");
			res.redirect("back");
	}
};

middlewareObj.checkUserOwnership = function(req, res, next) {
	if(req.isAuthenticated()){
				 User.findById(req.params.id, function(err, foundUser){
						if(err){
								req.flash("error", "The user cannot be found.");
								res.redirect("back");
						}  else {
								if (!foundUser) {
										 req.flash("error", "The item cannot be found.");
										 return res.redirect("back");
								 }
						 if(foundUser._id.equals(req.user._id) || req.user.isAdmin) {
								 next();
						 } else {
								 req.flash("error", "You do not have permission to do that.");
								 res.redirect("back");
						 }
						}
				 });
		 } else {
				 req.flash("error", "You need to be logged in to do that.");
				 res.redirect("back");
		 }
 }

module.exports = middlewareObj;