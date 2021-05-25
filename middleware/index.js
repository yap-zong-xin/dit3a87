var middlewareObj = {};
var User = require('../models/user');
var listing = require('../models/listing');
var Comment = require("../models/comment");

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please Login First!");
	res.redirect("/login");
}

middlewareObj.notLoggedIn = function(req, res, next){
	if(!req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You are already login");
	res.redirect("/");
}

middlewareObj.isAdmin = function(req, res, next){
	if(req.isAuthenticated() && req.user.isAdmin){
		return next();
	} else {
		req.flash("error", "You are not an admin!");
		res.redirect("/");
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
				if(foundComment.author.id.equals(req.user._id)){
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

module.exports = middlewareObj;