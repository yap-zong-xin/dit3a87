var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var listing = require("../models/listing");
var Comment = require("../models/comment");
var mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
var mapboxToken = process.env.MAPBOX_TOKEN;
var geocodingClient = mbxGeocoding({accessToken:mapboxToken});

//Index Route
router.get("/", function(req,res){
	res.render("listings/landing.ejs"); 
});

router.get("/listings", function(req, res){
	var perPage = 6;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if(req.query.search) {
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			listing.find({$or: [{name: regex,}, {description: regex}, {"author.username":regex}]}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
					listing.count({name: regex}).exec(function (err, count) {
							if (err) {
									console.log(err);
									res.redirect("back");
							} else {
									if(alllistings.length < 1) {
											noMatch = req.query.search;
									}
									res.render("listings/index.ejs", {
											listings: alllistings,
											current: pageNumber,
											pages: Math.ceil(count / perPage),
											noMatch: noMatch,
											search: req.query.search
									});
							}
					});
			});
	} else {
			// get all listings from DB
			listing.find({}).sort({createdAt: -1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
					listing.count().exec(function (err, count) {
							if (err) {
									console.log(err);
							} else {
									res.render("listings/index.ejs", {
											listings: alllistings,
											current: pageNumber,
											pages: Math.ceil(count / perPage),
											noMatch: noMatch,
											search: false
									});
							}
					});
			});
	}
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Post Route
router.post("/listings",middleware.isLoggedIn, async function(req,res){
	var name = req.body.name;
	var image = req.body.image;
	var desc = req.body.description;
	var location = req.body.location;
	var price = req.body.price;
  var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newlisting = {name:name, image:image, description:desc, author:author, location:location, price:price}
	try
		{
			var geoData = await geocodingClient.forwardGeocode({
		    query: location,
				autocomplete: false,
		    limit: 1
		  })
		  .send();
			newlisting.geometry = geoData.body.features[0].geometry;
			console.log(newlisting.geometry);
			
			listing.create(newlisting, function(err, newlyCreated){
				if(err)
				{
				console.log(err);
			}
			else
				{
					res.redirect("/listings");
				}
		});
	} catch (err){
		console.log(err.message);
		res.redirect('back');
	}
});

//New Route
router.get("/listings/new", middleware.isLoggedIn, function(req,res){
	res.render("listings/new.ejs");
});

//test 
router.get("/listings/A", function(req,res){
	var perPage = 12;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if(req.query.search) {
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			listing.find({$or: [{name: regex,}, {description: regex}, {"author.username":regex}]}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
					listing.count({name: regex}).exec(function (err, count) {
							if (err) {
									console.log(err);
									res.redirect("back");
							} else {
									if(alllistings.length < 1) {
											noMatch = req.query.search;
									}
									res.render("listings/A.ejs", {
											listings: alllistings,
											current: pageNumber,
											pages: Math.ceil(count / perPage),
											noMatch: noMatch,
											search: req.query.search
									});
							}
					});
			});
	}else if (req.query.Apply) {
		const minPrice = req.query.minPrice;
		const maxPrice = req.query.maxPrice;
		console.log(minPrice);
		listing.find({price: minPrice}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
			listing.count({price: minPrice}).exec(function (err, count) {
		if (err) {
			console.log(err);
			res.redirect("back");
		}else {
			res.render("listings/A.ejs", {
				listings: alllistings,
				current: pageNumber,
				pages: Math.ceil(count / perPage),
				noMatch: noMatch,
				search: req.query.search
			});
		}
	});
});
		// listing.find({price: minPrice})
	}else {
			// get all listings from DB
			listing.find({}).sort({createdAt: -1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
					listing.count().exec(function (err, count) {
							if (err) {
									console.log(err);
							} else {
									res.render("listings/A.ejs", {
											listings: alllistings,
											current: pageNumber,
											pages: Math.ceil(count / perPage),
											noMatch: noMatch,
											search: false
									});
							}
					});
			});
	}
});

//Show Route
router.get("/listings/:id", function(req, res){ 
  listing.findById(req.params.id).populate("comments likes").exec(function(err, foundlisting){
		if(err){
			res.redirect("/listings");
		} else{
			res.render("listings/show.ejs", {listing: foundlisting});
		}
	});
});

//Edit Route
router.get("/listings/:id/edit", middleware.checklistingOwnership, function(req, res){
	listing.findById(req.params.id, function(err, foundlisting){
		if(err){
			res.redirect("/listings");
		} else{
			res.render("listings/edit.ejs", {listing: foundlisting});
		}
	});
});

//Update Route
router.put("/listings/:id", middleware.checklistingOwnership, async (req, res) => {
	const geoData = await geocodingClient
		.forwardGeocode({
			query: req.body.listing.location,
			autocomplete: false,
			limit: 1
		})
		.send();
	// console.log(req.body.listing.location)
	listing.geometry = geoData.body.features[0].geometry;
	console.log(listing.geometry);
	
	listing.findByIdAndUpdate(req.params.id, req.body.listing, function(err, updatedlisting){
		console.log(req.body.listing);
		if(err){
			console.log(err);
		} else {
			req.flash("success", "Successfully update a listing");
			res.redirect(`/listings/` + req.params.id);
		}
	});
});

// router.put("/listings/:id", middleware.checklistingOwnership, async (req, res) => {
// 	const { id } = req.params;
// 	const geoData = await geocodingClient
// 		.forwardGeocode({
// 			query: req.body.listing.location,
// 			limit: 1,
// 		})
// 		.send();
// 	const listing = await listing.findByIdAndUpdate(id, {
// 		...req.body.listing,
// 	});
// 	listing.geometry = geoData.body.features[0].geometry;
// 	await listing.save();
// 	console.log(listing);
// 	req.flash("success", "Successfully update a listing");
// 	res.redirect(`/listings/${listing._id}`);
// });

//Delete Route
router.delete("/listings/:id", middleware.checklistingOwnership, function(req, res){
	listing.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/listings");
		} else{
			res.redirect("/listings");
		}
	});
});

router.post("/listings/:id/like", middleware.isLoggedIn, function (req, res) {
	listing.findById(req.params.id, function (err, foundlisting) {
			if (err) {
					console.log(err);
					return res.redirect("/listings");
			}

			// check if req.user._id exists in foundlisting.likes
			var foundUserLike = foundlisting.likes.some(function (like) {
					return like.equals(req.user._id);
			});

			if (foundUserLike) {
					// user already liked, removing like
					foundlisting.likes.pull(req.user._id);
			} else {
					// adding the new user like
					foundlisting.likes.push(req.user);
			}

			foundlisting.save(function (err) {
					if (err) {
							console.log(err);
							return res.redirect("/listings");
					}
					return res.redirect("/listings/" + foundlisting._id);
			});
	});
});

module.exports = router;