var express = require('express');
var router = express.Router();
var middleware = require('../middleware');
var mongoose = require("mongoose");
var listing = require("../models/listing");
var User = require("../models/user");
var Notification = require("../models/notification");
var Comment = require("../models/comment");
var mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
var mapboxToken = process.env.MAPBOX_TOKEN;
var geocodingClient = mbxGeocoding({accessToken:mapboxToken});
var multer = require('multer');
const axios = require('axios').default;
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var fileFilter = function (req, file, cb) {
    // accept image files only
	console.log('files type:'+file.mimetype);
	if(file.mimetype.match(/^image/i)) {
		if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
			return cb(new Error('Only [jpg/jpeg/png/gif] image files are allowed!'), false);
		}
		cb(null, true);
	} else if(file.mimetype.match(/^video/i)) {
		if (!file.originalname.match(/\.(mp4|mov|wmv|avi|avchd|flv|f4v|swf|mkv|webm|html5|mpeg-2)$/i)) {
			return cb(new Error('Only [mp4/mov/wmv/avi/avchd/flv/f4v/swf/mkv/webm/html5/mpeg-2] video files are allowed!'), false);
		}
		cb(null, true);
	}else {
		return cb(new Error('Invalid image/video format!'), false);
	}
	
};
//var upload = multer({ storage: storage, fileFilter: fileFilter})
var uploadMultiple = multer({ storage: storage, fileFilter: fileFilter}).fields([ { name: 'thumbnail', maxCount: 1 }, { name: 'image', maxCount: 10 }, { name: 'video', maxCount: 10 } ]);
// var uploadMultiple = upload.fields([ { name: 'image' }, { name: 'video' } ]);

var cloudinary = require('cloudinary');
const { reject } = require('async');
const { file } = require('googleapis/build/src/apis/file');
cloudinary.config({ 
  cloud_name: 'yappy', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function countApi(url) {
	const host = "https://api.countapi.xyz"
	try {
		return await axios.get(host + url);
	} catch (err) {
		console.log('myRequest error', err)
	}
}

//Index Route
router.get("/", function(req,res){
	res.render("listings/landing.ejs"); 
});

router.get("/listings", function(req,res){
	var noMatch = null;
	var perPage = 6;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var largestPrice = 0;
	var largestSize = 0;
	listing.find().sort({price: -1}).limit(1).exec(function(err, foundLargestPrice) {
		if(Object.keys(foundLargestPrice).length == 0) {
			largestPrice = 0;
		}else {
			largestPrice = foundLargestPrice[0].price
		}
		listing.find().sort({size: -1}).limit(1).exec(function(err, foundLargestSize) {
			if(Object.keys(foundLargestSize).length == 0) {
				largestSize = 0;
			}else {
				largestSize = foundLargestSize[0].size
			}
			if(req.query.search) {
					const regex = new RegExp(escapeRegex(req.query.search), 'gi');
					listing.find({$or: [{name: regex}, {description: regex}, {"author.username":regex}]}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
							listing.count({name: regex}).exec(function (err, count) {
									if (err) {
											console.log(err);
											res.redirect("back");
									} else {
											if(alllistings.length < 1) {
													noMatch = "result: '" + req.query.search + "' not found";
											}
											res.render("listings/index.ejs", {
													listings: alllistings,
													current: pageNumber,
													pages: Math.ceil(count / perPage),
													noMatch: noMatch,
													search: req.query.search,
													largestPrice: largestPrice,
													largestSize: largestSize,
													data: req.query
											});
									}
							});
					});
			} else if (req.query.Apply) {
				// Property Type
				// var type = req.query.type;
				// console.log('inputted type: '+type);
				// var regexType;
				// if(typeof type == 'undefined'){
				// 	var allType = [ 'HDB', 'Condo', 'Landed' ];
				// 	regexType = allType.map(function(e){return new RegExp(e, "gi");});
				// 	console.log('inside type: '+regexType);
				// }else {
				// 	regexType = new RegExp(type, "gi");
				// 	console.log('new regex for type: '+regexType);
				// }
				const hdbType = req.query.hdbType;
				const condoType = req.query.condoType;
				const landedType = req.query.landedType;
				var allType = []
				allType.push(hdbType, condoType, landedType);
				console.log('all type: '+allType);
				var typeArr=[];
				var regexType;
				var typeCount = 0;
				for(let i=0; i<allType.length; i++) {
					if(typeof allType[i]=='undefined'){
						console.log('counting type')
						typeCount++;
					}
				}
				if(typeCount == 3){
					allType = [ 'hdb', 'condo', 'landed' ];
					regexType = allType.map(function(e){return new RegExp(e, "gi");});
					console.log('inside type all empty: '+regexType);
				}else {
					for(let i=0; i<allType.length; i++) {
						if(!(typeof allType[i] == 'undefined')) { //contains value does not contain undefined
							console.log('all type at i: '+allType[i]);
							typeArr[i] = allType[i];
							console.log('inside type: '+typeArr);
							var typeArrRegex = typeArr.map(function(e){return new RegExp(e, "gi");});
							regexType = typeArrRegex.filter(function(eli){
								return eli != null && eli != '';
							})
							console.log('regexType: '+regexType)
						}

					}
				}
				
				// Zone 
				const northZone = req.query.northZone;
				const southZone = req.query.southZone;
				const eastZone = req.query.eastZone;
				const westZone = req.query.westZone;
				var allZone = [];
				allZone.push(northZone, southZone, eastZone, westZone);
				console.log('all zone: '+allZone);
				var zoneArr=[];
				var regexZone;
				var count = 0;
				for(let i=0; i<allZone.length; i++) {
					if(typeof allZone[i]=='undefined'){
						console.log('counting rooms')
						count++;
					}
				}
				if(count == 4){
					allZone = [ 'north', 'south', 'east', 'west' ];
					regexZone = allZone.map(function(e){return new RegExp(e, "gi");});
					console.log('inside Zone all empty: '+regexZone);
				}else {
					for(let i=0; i<allZone.length; i++) {
						if(!(typeof allZone[i] == 'undefined')) { //contains value does not contain undefined
							console.log('line 87: '+allZone[i]);
							zoneArr[i] = allZone[i];
							console.log('inside zone: '+zoneArr);
							var zoneArrRegex = zoneArr.map(function(e){return new RegExp(e, "gi");});
							regexZone = zoneArrRegex.filter(function(el){
								return el != null && el != '';
							})
							console.log('regexZone: '+regexZone)
						}

					}
				}
				// Price
				const minPrice = Number(req.query.minPrice);
				const maxPrice = Number(req.query.maxPrice);
				console.log("minPrice: "+minPrice);
				console.log("maxPrice: "+maxPrice);
				// Size
				const minSize = Number(req.query.minSize);
				const maxSize = Number(req.query.maxSize);
				console.log("minSize: "+minSize);
				console.log("minSize: "+maxSize);
				// Number of rooms 
				// var numofRooms = new Array(); 
				// numofRooms.push(req.query.numofRooms);
				// var newnumofRooms;
				// for(let i=0; i<numofRooms.length; i++){
				// 	if(typeof numofRooms[i] == 'undefined') {
				// 		newnumofRooms = [ 1, 2, 3, 4, 5, 6 ];
				// 		// console.log('inside rooms: '+newnumofRooms);
				// 	}else {
				// 		newnumofRooms = numofRooms;
				// 		console.log('totototot: '+newnumofRooms)
				// 	}
				// }
				const onerooms = req.query.onerooms;
				const tworooms = req.query.tworooms;
				const threerooms = req.query.threerooms;
				const fourrooms = req.query.fourrooms;
				const fiverooms = req.query.fiverooms;
				const sixrooms = req.query.sixrooms;
				var allRooms = [];
				allRooms.push(onerooms, tworooms, threerooms, fourrooms, fiverooms, sixrooms);
				console.log('all rooms: '+allRooms);
				var roomsArr=[];
				var regexRooms;
				var roomCount = 0;
				for(let i=0; i<allRooms.length; i++) {
					if(typeof allRooms[i]=='undefined'){
						console.log('counting rooms')
						roomCount++;
					}
				}
				if(roomCount == 6){
					regexRooms = [ 1, 2, 3, 4, 5, 6 ];
					// regexRooms = allRooms.map(function(e){return new RegExp(e, "gi");});
					console.log('inside room all empty: '+typeof regexRooms[1]);
				}else {
					for(let i=0; i<allRooms.length; i++) {
						if(!(typeof allRooms[i] == 'undefined')) { //contains value does not contain undefined
							console.log('line 87: '+allRooms[i]);
							roomsArr[i] = allRooms[i];
							console.log('inside rooms: '+roomsArr);
							// var roomsArrRegex = roomsArr.map(function(e){return new RegExp(e, "gi");});
							regexRooms = roomsArr.filter(function(elt){
								return elt != null && elt != '';
							})
							console.log('regexRooms: '+regexRooms)
						}

					}
				}
				// Sort object (to be passed into .sort)
				var sortOptions = { createdAt: -1};
				// Sort by Price
				var sortPrice = req.query.sortPrice;
				console.log('sort price type: '+sortPrice)	
				if(sortPrice == 'LowestPrice') {
					sortOptions.price = 1;
				}else if(sortPrice == 'HighestPrice') {
					sortOptions.price = -1 ;
				}
				// Sort by date added
				var sortDate = req.query.sortDate;
				console.log('sort date type: '+sortDate)	
				if(sortDate == 'Recent') {
					sortOptions.createdAt = -1;
				}else if(sortDate == 'Oldest') {
					sortOptions.createdAt = 1;
				}
				console.log('final sort option object: ',sortOptions);
				console.log('all parameters passed to mongo: '+minPrice+', '+maxPrice+', '+regexZone+', '+regexType+', '+minSize+', '+maxSize+', '+regexRooms);

				listing.find({$and: [ {price: {$gte: minPrice, $lte: maxPrice}}, {zone: {$in : regexZone}}, {type: {$in: regexType}}, {size: {$gte: minSize, $lte: maxSize}}, {numofRooms: {$in: regexRooms}} ] }).sort(sortOptions).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, alllistings) {
					listing.count({price: minPrice}).exec(function (err, count) {
						if (err) {
							console.log(err);
							res.redirect("back");
						}else {
							console.log('form data sthuff: ',req.query);
							res.render("listings/index.ejs", {
								listings: alllistings,
								current: pageNumber,
								pages: Math.ceil(count / perPage),
								noMatch: noMatch,
								search: req.query.search,
								largestPrice: largestPrice,
								largestSize: largestSize,
								data: req.query
							});
						}
					});
				});	
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
											search: false,
											largestPrice: largestPrice,
											largestSize: largestSize,
											data: req.query
										});
									}
							});
					});
			}
		});
	});

	//counts number of times homepage has been visited
	countApi("/hit/3dpropertylistingsg/visits").then(success => {
		console.log(success.data.value);
	});
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Post Route
// router.post("/listings", middleware.isLoggedIn, upload.single('image'), async function(req,res){
// 	var name = req.body.name;
// 	var desc = req.body.description;
// 	var location = req.body.location;
// 	var zone = req.body.zone;
// 	var price = req.body.price;
// 	var size = req.body.size;
// 	var type = req.body.type;
// 	var numofRooms = req.body.numofRooms;
//   var author = {
// 		id: req.user._id,
// 		username: req.user.username
// 	};
// 	// var newlisting = {name:name, image:image, description:desc, author:author, location:location, price:price, size:sie, zone:zone}
// 	var newlisting = {name:name, description:desc, author:author, location:location, zone:zone, price:price, size:size, type:type, numofRooms:numofRooms}
// 	try
// 		{
// 			var geoData = await geocodingClient.forwardGeocode({
// 				query: location,
// 				autocomplete: false,
// 		    limit: 1
// 		  })
// 		  .send();
// 			newlisting.geometry = geoData.body.features[0].geometry;
// 			// console.log(newlisting.geometry);
// 			cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
// 				// add cloudinary url for the image to the listing object under image property
// 				req.body.image = result.secure_url;
// 				newlisting.image = req.body.image
// 				// add image's public_id to listing object
// 				req.body.imageId = result.public_id;
// 				newlisting.imageId = req.body.imageId

// 				listing.create(newlisting, async function(err, newlyCreated){
// 					if(err)
// 					{
// 						console.log(err);
// 					} else {
// 						let user = await User.findById(req.user._id).populate('followers').exec();
// 						console.log(newlyCreated._id)
// 						let newNotification = {
// 							username: req.user.username,
// 							listingId: newlyCreated._id
// 						}
// 						for(const follower of user.followers) {
// 							let notification = await Notification.create(newNotification);
// 							follower.notifications.push(notification);
// 							follower.save();
// 						}
// 						req.flash("success", "listing successfully added!");
// 						res.redirect(`/listings/${newlyCreated._id}`);
// 					}
// 				});
// 			});
// 		} catch (err){
// 			console.log(err.message);
// 			res.redirect('back');
// 		}
// });

router.post("/listings", middleware.isLoggedIn, uploadMultiple, async function(req,res){
	var thumbnail = req.files.thumbnail;
	console.log('thumbnail sdkadnfj: '+thumbnail[0].path);

	var imageArray = req.files.image;

	var fileArray = [];
	for(let i = 0 ; i < imageArray.length; i++) {
		fileArray.push(req.files.image[i]);
	}
	if (req.files.video) {
		var videoArray = req.files.video;
		for(let i = 0 ; i < videoArray.length; i++) {
			fileArray.push(req.files.video[i]);
		}
	}

	var imageSecureUrlArray = [];
	var imagePublicIdArray = [];
	var videoSecureUrlArray = [];
	var videoPublicIdArray = [];

	var name = req.body.name;
	var desc = req.body.description;
	var location = req.body.location;
	var zone = req.body.zone;
	var price = req.body.price;
	var size = req.body.size;
	var type = req.body.type;
	var numofRooms = req.body.numofRooms;
  	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newlisting = {name:name, description:desc, author:author, location:location, zone:zone, price:price, size:size, type:type, numofRooms:numofRooms}
	try {
			var geoData = await geocodingClient.forwardGeocode({
				query: location,
				autocomplete: false,
		    limit: 1
		  })
		  .send();
			newlisting.geometry = geoData.body.features[0].geometry;
			// console.log(newlisting.geometry);

			//1 thumbnail image upload to cloudinary
			var thumbnailUpload = await uploadToCloudinary(thumbnail[0].path, { resource_type: "auto" });
			console.log('thumbnail upload await: ',thumbnailUpload);
			var thumbnailSecureUrl = thumbnailUpload.secure_url;
			var thumbnailPublicId = thumbnailUpload.public_id;
			newlisting.thumbnail = thumbnailSecureUrl;
			newlisting.thumbnailId = thumbnailPublicId;

		  	//image/videos upload to cloudinary
			for(let i=0; i<fileArray.length; i++) {
				if(fileArray[i].fieldname == 'image') {
					console.log('image uploading');
					var imageUpload = await uploadToCloudinary(fileArray[i].path); 
					imageSecureUrlArray.push(imageUpload.secure_url);
					imagePublicIdArray.push(imageUpload.public_id);
					newlisting.image = imageSecureUrlArray;
					newlisting.imageId = imagePublicIdArray;
					console.log('image info: ',newlisting.image,'imageid info:',newlisting.imageId)
				}else if(fileArray[i].fieldname == 'video') {
					console.log('video uploading');
					var videoUpload = await uploadToCloudinary(fileArray[i].path); 
					videoSecureUrlArray.push(videoUpload.secure_url);
					videoPublicIdArray.push(videoUpload.public_id);
					newlisting.video = videoSecureUrlArray;
					newlisting.videoId = videoPublicIdArray;
					console.log('video info: ',newlisting.video,'videoid info:',newlisting.videoId)
				}
			}

			//create the listing
			listing.create(newlisting, async function(err, newlyCreated){
				if(err)
				{
					console.log(err);
				} else {
					let user = await User.findById(req.user._id).populate('followers').exec();
					//console.log("id" + newlyCreated._id)
					let newNotification = {
						username: req.user.username,
						image: req.user.image,
						listingId: newlyCreated._id,
						idUser: newlyCreated.author.id,
						listingImage: newlyCreated.thumbnail
					}
					for(const follower of user.followers) {
						let notification = await Notification.create(newNotification);
						follower.notifications.push(notification);
						follower.save();
					}
					req.flash("success", "You have successfully added a listing.");
					res.redirect(`/listings/${newlyCreated._id}`);
				}
			});
		} catch (err){
			console.log('try catch error: ',err.message);
			res.redirect('back');
		}
});

// router.post("/listings", middleware.isLoggedIn, uploadMultiple, async function(req,res){
// 	var thumbnail = req.files.thumbnail;
// 	console.log('thumbnail sdkadnfj: '+thumbnail[0].path);

// 	var imageArray = req.files.image;
// 	var videoArray = req.files.video;

// 	var fileArray = [];
// 	for(let i = 0 ; i < imageArray.length; i++) {
// 		fileArray.push(req.files.image[i]);
// 	}
// 	if (videoArray) {
// 		for(let i = 0 ; i < videoArray.length; i++) {
// 			fileArray.push(req.files.video[i]);
// 		}
// 	}

// 	var imageSecureUrlArray = [];
// 	var imagePublicIdArray = [];
// 	var videoSecureUrlArray = [];
// 	var videoPublicIdArray = [];

// 	var name = req.body.name;
// 	var desc = req.body.description;
// 	var location = req.body.location;
// 	var zone = req.body.zone;
// 	var price = req.body.price;
// 	var size = req.body.size;
// 	var type = req.body.type;
// 	var numofRooms = req.body.numofRooms;
//   	var author = {
// 		id: req.user._id,//req.user._id
// 		username: req.user.username//req.user.username
// 	};
// 	var newlisting = {name:name, description:desc, author:author, location:location, zone:zone, price:price, size:size, type:type, numofRooms:numofRooms}
// 	try {
// 			var geoData = await geocodingClient.forwardGeocode({
// 				query: location,
// 				autocomplete: false,
// 		    limit: 1
// 		  })
// 		  .send();
// 			newlisting.geometry = geoData.body.features[0].geometry;
// 			// console.log(newlisting.geometry);

// 			var thumbnailUpload = await cloudinary.v2.uploader.upload(thumbnail[0].path, { resource_type: "auto" }, function(err, result) { 
// 				var thumbnailSecureUrl = result.secure_url;
// 				var thumbnailPublicId = result.public_id;

// 				newlisting.thumbnail = thumbnailSecureUrl;
// 				console.log('thumnail: '+newlisting.thumbnail);
// 				newlisting.thumbnailId = thumbnailPublicId;
// 				console.log('thumbnailID: '+newlisting.thumbnailId);
// 			}).send();
// 			console.log('thumbnail outside: '+thumbnailUpload);

// 			console.log('fileArray length b4: '+fileArray.length);
// 			for(let k=0; k<fileArray.length; k++) {
// 				cloudinary.v2.uploader.upload(fileArray[k].path, { resource_type: "auto" }, function(err, result) {
// 					if(fileArray[k].fieldname == 'image') {
// 						console.log('image handling');
// 						// add cloudinary url for the image to the listing object under image property
// 						imageSecureUrlArray.push(result.secure_url);
// 						// req.files.image = result.secure_url;
// 						// newlisting.image = req.files.image
// 						//add image's public_id to listing object
// 						imagePublicIdArray.push(result.public_id);
// 						// req.files.imageId = result.public_id;
// 						// newlisting.imageId = req.files.imageId
// 						newlisting.image = imageSecureUrlArray;
// 						console.log('new listing image: '+newlisting.image);
// 						newlisting.imageId = imagePublicIdArray;
// 						console.log('new listing imageID: '+newlisting.imageId);
// 					}else if(fileArray[k].fieldname == 'video') {
// 						console.log('video handling');
// 						// video secure url
// 						videoSecureUrlArray.push(result.secure_url);
// 						// req.files.video = result.secure_url;
// 						// newlisting.video = req.files.video
// 						// video public id
// 						videoPublicIdArray.push(result.public_id);
// 						// req.files.videoId = result.public_id;
// 						// newlisting.videoId = req.files.videoId
// 						newlisting.video = videoSecureUrlArray;
// 						console.log('new listing video: '+newlisting.video);
// 						newlisting.videoId = videoPublicIdArray;
// 						console.log('new listing videoID: '+newlisting.videoId);
// 					}
// 					console.log('amt of file arr: '+fileArray.length);
// 					console.log('k amt: '+k);
// 					console.log('k+1 amt: '+(k+1));
// 					if((k+1) == fileArray.length) {
// 						console.log('creating new listing now...');
// 						console.log('thumbnail stuff went in: '+newlisting.thumbnail);
// 						listing.create(newlisting, async function(err, newlyCreated){
// 							if(err)
// 							{
// 								console.log(err);
// 							} else {
// 								let user = await User.findById(req.user._id).populate('followers').exec();
// 								console.log(newlyCreated._id)
// 								let newNotification = {
// 									username: req.user.username,
// 									image: req.user.image,
// 									listingId: newlyCreated._id
// 								}
// 								for(const follower of user.followers) {
// 									let notification = await Notification.create(newNotification);
// 									follower.notifications.push(notification);
// 									follower.save();
// 								}
// 								req.flash("success", "You have successfully added a listing.");
// 								res.redirect(`/listings/${newlyCreated._id}`);
// 							}
// 						});
// 					}
// 				});
// 			}
// 		} catch (err){
// 			console.log(err.message);
// 			res.redirect('back');
// 		}
// });

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
			console.log('show route: '+foundlisting);
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
// router.put("/listings/:id", middleware.checklistingOwnership, uploadMultiple, function(req, res){
// 	listing.findById(req.params.id, async function(err, listing){
// 		if(err){
// 			req.flash("error", err.message);
// 			res.redirect("back");
// 		} else{
// 			console.log(listing)
// 			if(req.file){
// 					try{
// 							await cloudinary.v2.uploader.destroy(listing.imageId);
// 							var result = await cloudinary.v2.uploader.upload(req.file.path);
// 							listing.image = result.secure_url;
// 							listing.imageId = result.public_id;
// 					} catch(err){
// 							req.flash("error", err.message);
// 							return res.redirect("back");
// 					}
// 			}
// 			if(req.body.listing.location !== listing.location){
// 				console.log(req.body.location)
// 				console.log(listing.location)
// 				try {
// 						var response = await geocodingClient
// 								.forwardGeocode({
// 										query: req.body.listing.location,
// 										limit: 1,
// 								})
// 								.send();
// 						listing.geometry = response.body.features[0].geometry;
// 						listing.location = req.body.listing.location;
// 						console.log(listing.geometry)
// 				} catch (err) {
// 						console.log(err.message);
// 						res.redirect('back');
// 				}
// 			}
// 			listing.name = req.body.listing.name;
// 			listing.description = req.body.listing.description;
// 			listing.zone = req.body.listing.zone;
// 			listing.price = req.body.listing.price;
// 			listing.size = req.body.listing.size;
// 			listing.type = req.body.listing.type;
// 			listing.numofRooms = req.body.listing.numofRooms;
// 			listing.save();
// 			console.log(listing)
// 			req.flash("success", "listing successfully updated!");
// 			res.redirect("/listings/" + listing._id);
// 		}
// 	});
// });
router.put("/listings/:id", middleware.checklistingOwnership, uploadMultiple, function(req, res){
	listing.findById(req.params.id, async function(err, listing){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			// console.log(listing)
			if(req.files){
				//Thumbnail
				if(req.files.thumbnail) {
					var newThumbnail = req.files.thumbnail;
					console.log('new thumbnail object: '+newThumbnail);
					try{
						console.log('check for: '+listing.thumbnailId);
						await cloudinary.v2.uploader.destroy(listing.thumbnailId);
						console.log('paht check: '+newThumbnail[0].path);
						var result = await cloudinary.v2.uploader.upload(newThumbnail[0].path, { resource_type: "auto" });
						listing.thumbnail = result.secure_url;
						listing.thumbnailId = result.public_id;
					}catch(err) {
						req.flash("error", err.message);
						return res.redirect("back");
					}
				}
				//Image
				if(req.files.image) {
					var newImage = req.files.image;
					var newImageArray = [];
					for(let a=0; a<newImage.length; a++) {
						newImageArray.push(newImage[a]);
					}
					// console.log('new image array length: ',newImageArray.length);
					// console.log('new image stuff: ',newImageArray[0].path);
					var newImageSecureUrlArray = [];
					var newImagePublicIdArray = [];
					try{
						// console.log('check for: '+listing.imageId[0]);
						for(let b=0; b<listing.imageId.length; b++) {
							await cloudinary.v2.uploader.destroy(listing.imageId[b]);
						}
						
						for(let c=0; c<newImageArray.length; c++) {
							console.log('image paht check: ',newImageArray[c].path);
							var result = await cloudinary.v2.uploader.upload(newImageArray[c].path, { resource_type: "auto" });
							newImageSecureUrlArray.push(result.secure_url);
							newImagePublicIdArray.push(result.public_id);
							listing.image = newImageSecureUrlArray;
							listing.imageId = newImagePublicIdArray;
						}
					}catch(err) {
						req.flash("error", err.message);
						return res.redirect("back");
					}
				}
				//Video
				if(req.files.video) {
					var newVideo = req.files.video;
					var newVideoArray = [];
					for(let d=0; d<newVideo.length; d++) {
						newVideoArray.push(newVideo[d]);
					}
					// console.log('new video array length: ',newVideoArray.length);
					// console.log('new video stuff: ',newVideoArray[0].path);
					var newVideoSecureUrlArray = [];
					var newVideoPublicIdArray = [];
					try{
						// console.log('check for: '+listing.videoId[0]);
						for(let p=0; p<listing.videoId.length; p++) {
							await cloudinary.v2.uploader.destroy(listing.videoId[p]);
						}
						
						for(let k=0; k<newVideoArray.length; k++) {
							console.log('vide paht check: ',newVideoArray[k].path);
							var result = await cloudinary.v2.uploader.upload(newVideoArray[k].path, { resource_type: "auto" });
							newVideoSecureUrlArray.push(result.secure_url);
							newVideoPublicIdArray.push(result.public_id);
							listing.video = newVideoSecureUrlArray;
							listing.videoId = newVideoPublicIdArray;
						}
					}catch(err) {
						req.flash("error", err.message);
						return res.redirect("back");
					}
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
			listing.numofRooms = req.body.listing.numofRooms;
			listing.save();
			console.log(listing)
			req.flash("success", "You have successfully updated a listing.");
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
			Comment.remove({"_id": {$in: listing.comments}}, async function (err) {
				if (err) {
					console.log(err);
					return res.redirect("/listings");
				}
				//  delete the listing
				await cloudinary.v2.uploader.destroy(listing.imageId);
				listing.remove();
				req.flash("success", "You have successfully deleted a listing.");
				res.redirect('/listings');
			});
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

function uploadToCloudinary(file) {
	return new Promise((resolve, reject) => {
		cloudinary.v2.uploader.upload(file, { resource_type: "auto" }, (err, result) => {
			if(err) {
				return reject(err);
			}
			return resolve(result);
		})
	})
}

module.exports = router;