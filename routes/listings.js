var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var mongoose = require("mongoose");
var listing = require("../models/listing");
var Comment = require("../models/comment");
var mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
var mapboxToken = process.env.MAPBOX_TOKEN;
var geocodingClient = mbxGeocoding({accessToken:mapboxToken});
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'yappy', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//Index Route
router.get("/", function(req,res){
	res.render("listings/landing.ejs"); 
});

router.get("/listings", function(req,res){
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
	}else if (req.query.Apply) {
		const minPrice = Number(req.query.minPrice);
		const maxPrice = Number(req.query.maxPrice);
		console.log("minPrice: "+minPrice);
		console.log("maxPrice: "+maxPrice);

		var zone = new Array();
		zone.push(req.query.zone);
		console.log(zone);
		var regexZone;
		if(!zone) {
			var allZone = [ 'north', 'south', 'east', 'west' ];
			regexZone = allZone.map(function(e){return new RegExp(e, "gi");});
			console.log(zone);
		}else {
			regexZone = zone.map(function(e){return new RegExp(e, "gi");});
		}

		var type = new Array(); 
		type.push(req.query.type);
		console.log(type);
		var regexType;
		if(!type) {
			var allType = [ 'HDB', 'Condo', 'Landed' ];
			regexType = allType.map(function(e){return new RegExp(e, "gi");});
			console.log(type);
		}else {
			var regexType = type.map(function(e){return new RegExp(e, "gi");});
		}
		const minSize = Number(req.query.minSize);
		const maxSize = Number(req.query.maxSize);
		console.log("minSize: "+minSize);
		console.log("minSize: "+maxSize);
		listing.find({$and: [ {price: {$gte: minPrice, $lte: maxPrice}}, {zone: {$in : regexZone}}, {type: {$in: regexType}}, {size: {$gte: minSize, $lte: maxSize}} ] }).sort({zone:1, price:1, name:1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
			listing.count({price: minPrice}).exec(function (err, count) {
		if (err) {
			console.log(err);
			res.redirect("back");
		}else {
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
		// listing.find({price: minPrice})
	}else {
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
router.post("/listings", middleware.isLoggedIn, upload.single('image'), async function(req,res){
	var name = req.body.name;
	var desc = req.body.description;
	var location = req.body.location;
	var zone = req.body.zone;
	var price = req.body.price;
	var size = req.body.size;
	var type = req.body.type;
  var author = {
		id: req.user._id,
		username: req.user.username
	};
	// var newlisting = {name:name, image:image, description:desc, author:author, location:location, price:price, size:sie, zone:zone}
	var newlisting = {name:name, description:desc, author:author, location:location, zone:zone, price:price, size:size, type:type}
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
			
			cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
				// add cloudinary url for the image to the listing object under image property
				req.body.image = result.secure_url;
				newlisting.image = req.body.image
				// add image's public_id to listing object
				req.body.imageId = result.public_id;
				newlisting.imageId = req.body.imageId
				console.log(newlisting)
				listing.create(newlisting, function(err, newlyCreated){
					if(err)
						{
						console.log(err);
					} else {
							res.redirect("/listings");
					}
				});
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
router.put("/listings/:id", middleware.checklistingOwnership, upload.single("image"), function(req, res){
	listing.findById(req.params.id, async function(err, listing){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			console.log(listing)
			if(req.file){
					try{
							await cloudinary.v2.uploader.destroy(listing.imageId);
							var result = await cloudinary.v2.uploader.upload(req.file.path);
							listing.image = result.secure_url;
							listing.imageId = result.public_id;
					} catch(err){
							req.flash("error", err.message);
							return res.redirect("back");
					}
			}
			if(req.body.listing.location !== listing.location){
				console.log(req.body.location)
				console.log(listing.location)
				try {
						var response = await geocodingClient
								.forwardGeocode({
										query: req.body.listing.location,
										limit: 1,
								})
								.send();
						listing.geometry = response.body.features[0].geometry;
						listing.location = req.body.listing.location;
						console.log(listing.geometry)
				} catch (err) {
						console.log(err.message);
						res.redirect('back');
				}
			}
			listing.name = req.body.listing.name;
			listing.description = req.body.listing.description;
			listing.zone = req.body.listing.zone;
			listing.price = req.body.listing.price;
			listing.size = req.body.listing.size;
			listing.type = req.body.listing.type;
			listing.save();
			console.log(listing)
			req.flash("success", "Successfully Updated!");
			res.redirect("/listings/" + listing._id);
		}
	});
});

//Delete Route
router.delete("/listings/:id", middleware.checklistingOwnership, function(req, res){
  listing.findById(req.params.id, async function(err, listing) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(listing.imageId);
        listing.remove();
        req.flash('success', 'listing deleted successfully!');
        res.redirect('/listings');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
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