var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var listing = require("../models/listing");
var Comment = require("../models/comment");
var mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
var mapboxToken = process.env.MAPBOX_TOKEN;
var geocodingClient =mbxGeocoding({accessToken:mapboxToken});

//Index Route
router.get("/", function(req,res){
	res.render("listings/landing.ejs"); 
});

router.get("/listings", function(req, res){
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		//search the different types (name/time/date)
		listing.find({$or: [{name: regex,}, {description: regex}, {"author.username":regex}]}, function(err, alllistings){
		if(err){
			console.log(err);
		} else{
			if(alllistings.length < 1) {
                  noMatch = "No listings match that query, please try again.";
		    }
			res.render("listings/index.ejs", {listings: alllistings, noMatch: noMatch});
		} 
	});	
	}else{
		listing.find({}, function(err, alllistings){
		if(err){
			console.log(err);
		} else{
			res.render("listings/index.ejs", {listings: alllistings, noMatch: noMatch});
		} 
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
  var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newlisting = {name:name, image:image, description:desc, author:author, location:location}
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

//Show Route
router.get("/listings/:id", function(req, res){ 
  listing.findById(req.params.id).populate("comments").exec(function(err, foundlisting){
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

module.exports = router;