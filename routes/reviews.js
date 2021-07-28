var express = require("express");
var router = express.Router({mergeParams: true});
var User = require("../models/user");
var Review = require("../models/review");
var middleware = require("../middleware");

var moment = require('moment');

// Reviews Index
router.get("/user/:id/reviews", function (req, res) {
    User.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, user) {
        if (err || !user) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index.ejs", {user: user});
    });
});

// Reviews New
router.get("/user/:id/reviews/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the user, only one review per user is allowed
    User.findById(req.params.id, function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new.ejs", {user: user});
    });
});

// Reviews Create
router.post("/user/:id/reviews", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup user using ID
    User.findById(req.params.id).populate("reviews").exec(function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated user to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.author.image = req.user.image;
            review.user = user;
            //save review
            review.save();
            user.reviews.push(review);
            // calculate the new average review for the user
            user.rating = calculateAverage(user.reviews);
            //save user
            user.save();
            req.flash("success", "You have successfully added a review.");
            res.redirect('/user/' + user._id + '/reviews');
        });
    });
});

// Reviews Edit
router.get("/user/:id/reviews/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        var reviewDate; 
        if(foundReview.updatedAt) {
            reviewDate = foundReview.updatedAt;
            console.log('have been updated: '+ reviewDate);
        }else {
            reviewDate = foundReview.createdAt;
            console.log('original not updated: '+reviewDate);
        }
        var latestReview = moment(reviewDate);
        var expireReview = latestReview.clone().add(1, 'weeks');  //.add(10, 'seconds');
        console.log('latest foundReview: '+latestReview);
        console.log('expire Reivew: '+expireReview);

        var currentDate = moment();
        console.log('current date now: '+currentDate);
        if (currentDate >= expireReview){
            console.log('edit button should be expired')
            // clearInterval(intervalCheck);
            req.flash("error", 'You are no longer allowed to edit the review.');
            return res.redirect("back"); 
        }   
        res.render("reviews/edit.ejs", {user_id: req.params.id, review: foundReview});
    });
});
// Reviews Edit at Dashboard
router.get("/user/:id/reviews/:review_id/edit/dashboard", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        var reviewDate; 
        if(foundReview.updatedAt) {
            reviewDate = foundReview.updatedAt;
            console.log('have been updated: '+ reviewDate);
        }else {
            reviewDate = foundReview.createdAt;
            console.log('original not updated: '+reviewDate);
        }
        var latestReview = moment(reviewDate);
        var expireReview = latestReview.clone().add(1, 'weeks');  //.add(10, 'seconds');
        console.log('latest foundReview: '+latestReview);
        console.log('expire Reivew: '+expireReview);

        var currentDate = moment();
        console.log('current date now: '+currentDate);
        if (currentDate >= expireReview){
            console.log('edit button should be expired')
            // clearInterval(intervalCheck);
            req.flash("error", 'You are no longer allowed to edit the review.');
            return res.redirect("back"); 
        }   
        res.render("dashboards/reviews/edit.ejs", {user_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/user/:id/reviews/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        User.findById(req.params.id).populate("reviews").exec(function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate user average
            user.rating = calculateAverage(user.reviews);
            //save changes
            user.save();
            req.flash("success", "You have successfully edited a review.");
            res.redirect('/user/' + user._id + '/reviews');
        });
    });
});
// Reviews Update at Dashboard
router.put("/user/:id/reviews/:review_id/dashboard", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        User.findById(req.params.id).populate("reviews").exec(function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate user average
            user.rating = calculateAverage(user.reviews);
            //save changes
            user.save();
            req.flash("success", "You have successfully edited a review.");
            res.redirect("/dashboard/reviews");
        });
    });
});

// Reviews Delete
router.delete("/user/:id/reviews/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        User.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate user average
            user.rating = calculateAverage(user.reviews);
            //save changes
            user.save();
            req.flash("success", "You have successfully deleted a review.");
            res.redirect("/user/" + req.params.id + '/reviews');
        });
    });
});
// Reviews Delete at Dashboard
router.delete("/user/:id/reviews/:review_id/dashboard", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        User.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate user average
            user.rating = calculateAverage(user.reviews);
            //save changes
            user.save();
            req.flash("success", "You have successfully deleted a review.");
            res.redirect("/dashboard/reviews");
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;