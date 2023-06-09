var express = require('express');
var router = express.Router();
var listing = require("../models/listing");
var Comment = require("../models/comment");
var middleware = require('../middleware');

//New Route
router.get("/listings/:id/comments/new", middleware.isLoggedIn, function(req, res){
	//find listing by id
	listing.findById(req.params.id, function(err, listing){
		if(err){
			console.log(err);
		} else{
			res.render("comments/new.ejs", {listing: listing});
		}
	});
});

//Post Route
router.post("/listings/:id/comments", middleware.isLoggedIn, function(req, res){
//lookup listing using ID first before posting the comments
	listing.findById(req.params.id, function(err, listing){
		if(err){
			console.log(err);
			res.redirect("/listings");
      //create new comment
      //connect new comment to listing
      //redirect listing show page
    } else {
      //create new comment
      Comment.create(req.body.comment, function(err, comment){
        if(err){
          console.log(err);
        } else{
          //add username & id to comment
          //can retrieve username/id (based on models/comment.js) from req.user since users must login before the code runs here (isLoggedIn)
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          comment.author.image = req.user.image;
          comment.author.listingId = req.params.id;
          //save comment
          comment.save();
          //connect new comment to listing
          //redirect listing show page
          listing.comments.push(comment);
          listing.save();
					req.flash("success", "You have successfully posted a comment.");
          res.redirect('/listings/' + listing._id);
        }
      });
    }
	});
});

//Edit Route
router.get("/listings/:id/comments/:comment_id/edit/dashboard", middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			res.redirect("back");
		} else{
			res.render("dashboards/comments/edit.ejs", {listing_id: req.params.id, comment: foundComment});
		}
	})
});

//Update Route
router.put("/listings/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
  //can use req.body.listing due to the name="listing[...] in EDIT.EJS" 
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
    if(err){
      res.redirect("back");
    } else{
      req.flash("success", "You have successfully updated a comment.");
      res.redirect("/listings/" + req.params.id);
    }
  });
});
//Update Route at Dashboard
router.put("/listings/:id/comments/:comment_id/dashboard", middleware.checkCommentOwnership, function(req, res){
  //can use req.body.listing due to the name="listing[...] in EDIT.EJS" 
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
    if(err){
      res.redirect("back");
    } else{
      req.flash("success", "You have successfully updated a comment.");
      res.redirect("/dashboard/comments");
    }
  });
});

//Delete Route
router.delete("/listings/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req,res) {
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if (err) {
      res.redirect("back");
    } else {
      listing.findByIdAndUpdate(req.params.id,{ $pull: { comments: { $in: [req.params.comment_id] } } },
        function(err) {
          if (err) {
            console.log(err);
          }
        }
      );
      req.flash("success", "You have successfully deleted a comment.");
      res.redirect("/listings/" + req.params.id);
    }
  });
});
//Delete Route at Dashboard
router.delete("/listings/:id/comments/:comment_id/dashboard", middleware.checkCommentOwnership, function(req,res) {
  Comment.findByIdAndRemove(req.params.comment_id, function(err) {
    if (err) {
      res.redirect("back");
    } else {
      listing.findByIdAndUpdate(req.params.id,{ $pull: { comments: { $in: [req.params.comment_id] } } },
        function(err) {
          if (err) {
            console.log(err);
          }
        }
      );
      req.flash("success", "You have successfully deleted a comment.");
      res.redirect("/dashboard/comments");
    }
  });
});

module.exports = router;