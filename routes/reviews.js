var express = require("express");
var router = express.Router({mergeParams: true});
var User = require("../models/user");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/agent/:id/reviews", function (req, res) {
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
router.get("/agent/:id/reviews/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
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
router.post("/agent/:id/reviews", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
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
            review.user = user;
            //save review
            review.save();
            user.reviews.push(review);
            // calculate the new average review for the user
            user.rating = calculateAverage(user.reviews);
            //save user
            user.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/agent/' + user._id);
        });
    });
});

// Reviews Edit
router.get("/agent/:id/reviews/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit.ejs", {user_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/agent/:id/reviews/:review_id", middleware.checkReviewOwnership, function (req, res) {
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
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/agent/' + user._id);
        });
    });
});

// Reviews Delete
router.delete("/agent/:id/reviews/:review_id", middleware.checkReviewOwnership, function (req, res) {
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
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/agent/" + req.params.id);
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