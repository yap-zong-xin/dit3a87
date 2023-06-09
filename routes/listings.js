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
var moment = require('moment');
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
		if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|jfif)$/i)) {
			return cb(new Error('Only [jpg/jpeg/png/gif/webp/jfif] image files are allowed!'), false);
		}
		cb(null, true);
	} else if(file.mimetype.match(/^video/i)) {
		if (!file.mimetype.match(/\/(mp4|mov|wmv|avi|avchd|flv|f4v|swf|mkv|webm|html5|mpeg-2)$/i)) {
			return cb(new Error('Only [mp4/mov/wmv/avi/avchd/flv/f4v/swf/mkv/webm/html5/mpeg-2] video files are allowed!'), false);
		}
		cb(null, true);
	}else {
		return cb(new Error('Invalid image/video format!'), false);
	}
	
};
// var fileFilter = function (req, file, cb) {
//     // accept image files only
// 	console.log('files type: '+typeof file.mimetype);
// 	console.log('files filter: ', file);
// 	if(file.mimetype.match(/^image/i)) {
// 		console.log('matched image')
// 		if (!(file.mimetype.includes("jpg", "jpeg", "png", "gif"))) {
// 			return cb(new Error('Only [jpg/jpeg/png/gif] image files are allowed!'), false);
// 		}
// 		cb(null, true);
// 	}
// 	if(file.mimetype.match(/^video/i)) {
// 		console.log('matched video')
// 		if (!(file.mimetype.includes("mp4", "mov", "wmv", "avi", "avchd", "flv", "f4v", "swf", "mkv", "webm", "html5", "mpeg-2"))) {
// 			return cb(new Error('Only [mp4/mov/wmv/avi/avchd/flv/f4v/swf/mkv/webm/html5/mpeg-2] video files are allowed!'), false);
// 		}
// 		cb(null, true);
// 	}
// };
// var fileFilter = function (req, file, cb) {
// 	console.log('files type:'+file.mimetype);
// 	if(file.mimetype.includes("image")) {
// 		if (file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
// 			return cb(null, true);
// 		}
// 		cb(new Error('Invalid file'));
// 	} else if(file.mimetype.includes("video")) {
// 		if (file.originalname.match(/\.(mp4|mov|wmv|avi|avchd|flv|f4v|swf|mkv|webm|html5|mpeg-2)$/i)) {
// 			return cb(null, true);
// 		}
// 		cb(new Error('Invalid file'));
// 	}
	
// };
//var upload = multer({ storage: storage, fileFilter: fileFilter})
var upload = multer({ storage: storage, fileFilter: fileFilter});//{ name: 'galleryFileArray', maxCount: 20 }
// var uploadMultiple = upload.fields([ { name: 'thumbnailFile', maxCount: 1 }, { name: 'imageGallery', maxCount: 20 }, { name: 'videoGallery', maxCount: 20 } ]);//{ name: 'galleryFileArray', maxCount: 20 }
var uploadMultiple = upload.fields([ { name: 'listingThumbnail', maxCount: 1 }, { name: 'additionalGallery', maxCount: 20 }, { name: 'listingGallery', maxCount: 20 } ]);
// var uploadMultiple = multer({ storage: storage, fileFilter: fileFilter}).fields([ { name: 'listingThumbnail', maxCount: 1 }, { name: 'listingGallery', maxCount: 20 } ]);
// var uploadMultiple = upload.fields([ { name: 'image' }, { name: 'video' } ]);
// var uploadMultiple = multer({ storage: storage, fileFilter: fileFilter}).fields([ { name: 'thumbnail', maxCount: 1 }, { name: 'image', maxCount: 10 }, { name: 'video', maxCount: 10 } ]);

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
	//counts number of times homepage has been visited
	countApi("/hit/3dpropertylistingsg/visits");
	res.render("listings/landing.ejs"); 
});

router.get("/listings", function(req,res){
	var noMatch = null;
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
			console.log('jfkd: ', req.query)
			//listing index page - Main page
			if(req.query.searchindexBtn) {
					//listing category residential or commercial
					if(req.query.listType) {
						var listType = req.query.listType;
					}else {
						var listType = ['residential', 'commercial'];
					}
					//search box	
					const regex = new RegExp(escapeRegex(req.query.searchindex), 'gi');

					//Property Type
					var propType = req.query.propertyType;
					var propTypeArr = [];
					if(propType == 'allType' || !propType) {
						propTypeArr = ['hdb', 'condo', 'executivecondo', 'landed', 'terrace', 'semidetached', 'detached'];
					}else {
						propTypeArr.push(req.query.propertyType);
					}
					var regexType = propTypeArr;

					//Number of rooms
					var numofRooms = Number(req.query.numofRooms);
					var numofRoomsArr = [];
					if(numofRooms == "allrooms" || !numofRooms) {
						numofRoomsArr = [1,2,3,4,5,6];
					}else {
						numofRoomsArr.push(numofRooms)
					}
					regexRooms = numofRoomsArr;

					//MIN & MAX Price
					var minPrice = 0;
					var maxPrice = largestPrice;
					var minSize = 0;
					var maxSize = largestSize;
					if(req.query.minPrice) {
						minPrice = Number(req.query.minPrice);
					}
					if(req.query.maxPrice) {
						maxPrice = Number(req.query.maxPrice);
					}
					console.log("minPrice: "+minPrice);
					console.log("maxPrice: "+maxPrice);
					//MIN & MAX Size
					if(req.query.minSize) {
						minSize = Number(req.query.minSize);
					}
					if(req.query.maxSize) {
						maxSize = Number(req.query.maxSize);
					}
					console.log("minSize: "+minSize);
					console.log("minSize: "+maxSize);

					// Sort object (to be passed into .sort)
					var sortOptions = {};
					// Sort options
					var sort = req.query.sortBy;
					if(sort == 'LowestPrice') {
						sortOptions.price = 1;
					}else if(sort == 'HighestPrice') {
						sortOptions.price = -1 ;
					}else if(sort == 'Recent') {
						sortOptions.createdAt = -1;
					}else if(sort == 'Oldest') {
						sortOptions.createdAt = 1;
					}else if(sort == 'MostPop') {
						sortOptions.likes = -1;
					}else if(sort == 'LeastPop') {
						sortOptions.likes = 1;
					}

					//if no sort is selected
					if(Object.keys(sortOptions).length == 0) {
						sortOptions.createdAt = 1
					}

					//QUERY
					listing.find({ $and: [{listingCategory: {$in: listType}}, {type: {$in: regexType}}, {bedrooms: {$in: regexRooms}}, {price: {$gte: minPrice, $lte: maxPrice}}, {size: {$gte: minSize, $lte: maxSize}}, {soldStatus: false}, {archiveStatus: false}, {$or: [{name: regex}, {description: regex}, {"author.username":regex}]} ] }).populate('author.id').sort(sortOptions).exec(function (err, alllistings) {
						listing.count({name: regex}).exec(function (err, count) {
								if (err) {
										console.log(err);
										res.redirect("back");
								} else {
										if(alllistings.length < 1) {
												noMatch = "result: '" + req.query.searchindex + "' not found";
										}

										res.render("listings/search.ejs", {
												listings: alllistings,
												noMatch: noMatch,
												search: req.query.searchindex,
												largestPrice: largestPrice,
												largestSize: largestSize,
												data: req.query
										});
								}
						});
					});

			//search listing page - 2nd page 
			}else if(req.query.searchListing) {
				console.log('dearch shtigna: ', req.query.search);
					const regex = new RegExp(escapeRegex(req.query.search), 'gi');
					console.log('regex input: ',regex)
					listing.find({ $and: [{soldStatus: false}, {archiveStatus: false}, {$or: [{name: regex}, {description: regex}, {"author.username":regex}]} ] }).populate('author.id').exec(function (err, alllistings) {
						listing.count({name: regex}).exec(function (err, count) {
								if (err) {
										console.log(err);
										res.redirect("back");
								} else {
										if(alllistings.length < 1) {
												noMatch = "result: '" + req.query.search + "' not found";
										}

										res.render("listings/search.ejs", {
												listings: alllistings,
												noMatch: noMatch,
												search: req.query.search,
												largestPrice: largestPrice,
												largestSize: largestSize,
												data: req.query
										});
								}
						});
				});
			//Filter - 2nd page
			}  else if (req.query.Apply) {
				// Property Type
				var propTypeArr = [];
				console.log('reqkj: ', req.query.propType)
				if(typeof req.query.propType == 'object') {
					for(let i=0; i<req.query.propType.length; i++) {
						propTypeArr.push(req.query.propType[i]);
					}	
				}else if(typeof req.query.propType == 'string') {
					propTypeArr.push(req.query.propType);
				}else {
					propTypeArr = ['hdb', 'condo', 'executivecondo', 'landed', 'terrace', 'semidetached', 'detached'];
				}
				var regexType = propTypeArr;

				// Zone 
				var zoneArr = [];
				if(typeof req.query.zone == 'object') {
					for(let i=0; i<req.query.zone.length; i++) {
						zoneArr.push(req.query.zone[i]);
					}	
				}else if(typeof req.query.zone == 'string') {
					zoneArr.push(req.query.zone);
				}else {
					zoneArr = ['north', 'south', 'east', 'west'];
				}
				var regexZone = zoneArr;

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
				var bedroomsArr = [];
				if(typeof req.query.bedrooms == 'object') {
					for(let i=0; i<req.query.bedrooms.length; i++) {
						bedroomsArr.push(Number(req.query.bedrooms[i]));
					}	
				}else if(typeof req.query.bedrooms == 'string') {
					bedroomsArr.push(Number(req.query.bedrooms));
				}else {
					bedroomsArr = [ 1, 2, 3, 4, 5, 6 ];
				}
				var regexRooms = bedroomsArr;

				//number of bath rooms
				var bathroomsArr = [];
				if(typeof req.query.bathrooms == 'object') {
					for(let i=0; i<req.query.bathrooms.length; i++) {
						bathroomsArr.push(Number(req.query.bathrooms[i]));
					}	
				}else if(typeof req.query.bathrooms == 'string') {
					bathroomsArr.push(Number(req.query.bathrooms));
				}else {
					bathroomsArr = [ 1, 2, 3, 4, 5, 6 ];
				}
				var regexbathRooms = bathroomsArr;

				//Tenure
				var tenureArr = [];
				if(typeof req.query.tenure == 'object') {
					for(let i=0; i<req.query.tenure.length; i++) {
						tenureArr.push(req.query.tenure[i]);
					}	
				}else if(typeof req.query.tenure == 'string') {
					tenureArr.push(req.query.tenure);
				}else {
					tenureArr = ['freehold', 'ninetynine', 'hundredthree', 'hundredten', '999', 'unknown'];
				}
				var regexTenure = tenureArr;

				// Sort object (to be passed into .sort)
				var sortOptions = {};
				var sort = req.query.sort;
				// Sort by Price
				if(sort == 'LowestPrice') {
					sortOptions.price = 1;
				}else if(sort == 'HighestPrice') {
					sortOptions.price = -1 ;
				}else if(sort == 'Recent') {
					sortOptions.createdAt = -1;
				}else if(sort == 'Oldest') {
					sortOptions.createdAt = 1;
				}else if(sort == 'Sold') {
					sortOptions.soldStatus = -1;
				}else if(sort == 'NotSold') {
					sortOptions.soldStatus = 1;
				}else if(sort == 'Archive') {
					sortOptions.archiveStatus = -1;
				}else if(sort == 'NotArchive') {
					sortOptions.archiveStatus = 1;
				}else if(sort == 'MostPop') {
					sortOptions.likes = -1;
				}else if(sort == 'LeastPop') {
					sortOptions.likes = 1;
				}
				//if no sort is selected
				if(Object.keys(sortOptions).length == 0) {
					sortOptions.createdAt = -1
				}

				//sold listing
				const soldCheck = req.query.soldCheck;
				const archiveCheck = req.query.archiveCheck;
				console.log('sold check: '+soldCheck);
				console.log('archive check: '+archiveCheck);
				var regexSold = [false];
				var regexArchive = [false];
				if(soldCheck){ //if sold is check, show sold and not sold only
					regexSold = [true];
				}
				if(archiveCheck){
					regexArchive = [true];
				}

				console.log('1: ', regexType)
				console.log('2: ', regexZone)
				console.log('3: ', regexRooms)
				console.log('4: ', regexbathRooms)
				console.log('5: ', regexTenure)


				listing.find({$and: [ {price: {$gte: minPrice, $lte: maxPrice}}, {zone: {$in: regexZone}}, {type: {$in: regexType}}, {size: {$gte: minSize, $lte: maxSize}}, {bedrooms: {$in: regexRooms}}, {bathrooms: {$in: regexbathRooms}}, {tenure: {$in: regexTenure}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}} ] }).sort(sortOptions).populate('author.id').exec(function (err, alllistings) {
					listing.count({price: minPrice}).exec(function (err, count) {
						if (err) {
							console.log(err);
							res.redirect("back");
						}else {

							//====== for listing analytics
							for (var i = 0; i < alllistings.length; i++) {
								//id
								var id = alllistings[i]._id;
								// console.log(alllistings[i]._id);

								async function postCount (id) {
									await countApi("/hit/3dpropertylistingsg/" +  id + "-click").then(success => {
									// console.log("https://api.countapi.xyz/hit/3dpropertylistingsg/" + id + "-click");
									// console.log("id: " + id + "success: " + success.data.value);
								});
								}
								postCount(id)
							}
							
							console.log('form data sthuff: ',req.query);

							res.render("listings/search.ejs", {
								listings: alllistings,
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
					listing.find({$and: [{soldStatus: false}, {archiveStatus: false}] })
					.sort({createdAt: -1})
					.populate('author.id')
					.exec(function (err, alllistings) {
							listing.count().exec(function (err, count) {
									if (err) {
											console.log(err);
									} else {
										// for (var i = 0; i < alllistings.length; i++) {
										// 	//id
										// 	var id = alllistings[i]._id;
										// 	// console.log(alllistings[i]._id);

										// 	async function postCount (id) {
										// 		await countApi("/hit/3dpropertylistingsg/" +  id + "-click")
										// 	}
										// 	postCount(id)
										// }
										res.render("listings/index.ejs", {
											listings: alllistings,
											noMatch: noMatch,
											search: false,
											largestPrice: largestPrice,
											largestSize: largestSize,
											data: req.query,
											moment : moment
										});
									}
							});
					});
			}
		});
	});

});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Post Route
router.post("/listings", middleware.isAdminAgent, uploadMultiple, async function(req,res){
	var listingThumbnail = req.files.listingThumbnail;
	var listingGallery = req.files.listingGallery;
	
	var imageSecureUrlArray = [];
	var imagePublicIdArray = [];
	var videoSecureUrlArray = [];
	var videoPublicIdArray = [];

	var name = req.body.name;
	var desc = req.body.description;
	var location = req.body.location;
	var unitNumber = req.body.unitNumber;
	var street = req.body.street;
	var zone = req.body.zone;
	var district = req.body.district;
	var price = req.body.price;
	var size = req.body.size;
	var type = req.body.type;
	var bedrooms = Number(req.body.bedrooms);
	var bathrooms = Number(req.body.bathrooms);
	var tenure = req.body.tenure;
	var threeDImage = req.body.threeDImage;
	var listingCategory = req.body.listingCategory;
	var author = {
		id: req.user._id,
		username: req.user.username,
		firstName: req.user.firstName,
		lastName: req.user.lastName,
		email: req.user.email,
		image: req.user.image,
		createdAt: req.user.createdAt,
		cea: req.user.cea,
		rating: req.user.rating,
		phone: req.user.phone,
	};
	var newlisting = {name:name, description:desc, author:author, location:location, unitNumber:unitNumber, street:street, zone:zone, district:district, price:price, size:size, type:type, bedrooms:bedrooms, bathrooms:bathrooms, tenure:tenure, threeDImage:threeDImage, listingCategory:listingCategory}
	if(req.body.carpark === 'true'){
		newlisting.carpark = true;
	}
	if(req.body.pool === 'true'){
		newlisting.pool = true;
	}
	if(req.body.gym === 'true'){
		newlisting.gym = true;
	}
	if(req.body.playground === 'true'){
		newlisting.playground = true;
	}
	if(req.body.hall === 'true'){
		newlisting.hall = true;
	}
	if(req.body.mall === 'true'){
		newlisting.mall = true;
	}
	if(req.body.intercom === 'true'){
		newlisting.intercom = true;
	}
	if(req.body.security === 'true'){
		newlisting.security = true;
	}
	try {
		try {
			var geoData = await geocodingClient.forwardGeocode({
				query: location,
				autocomplete: false,
		    limit: 1
		  })
		  .send();
			newlisting.geometry = geoData.body.features[0].geometry;
			// console.log(newlisting.geometry);
		}catch(err) {
			console.log('geometry error: ',err.message);
			req.flash("error", "Postal code not found.");
			return res.redirect('back');
		}

			try { 
				//1 thumbnailFile image upload to cloudinary
				var thumbnailUpload = await uploadToCloudinary(listingThumbnail[0].path, { resource_type: "auto" });
				console.log('listingThumbnail upload await: ',thumbnailUpload);
				newlisting.thumbnail = thumbnailUpload.secure_url;
				newlisting.thumbnailId = thumbnailUpload.public_id;	

				//image/videos upload to cloudinary
				for(let i=0; i<listingGallery.length; i++) {
					if(listingGallery[i].mimetype.includes('image')) {
						console.log('image uploading');
						var imageUpload = await uploadToCloudinary(listingGallery[i].path); 
						imageSecureUrlArray.push(imageUpload.secure_url);
						imagePublicIdArray.push(imageUpload.public_id);
						newlisting.image = imageSecureUrlArray;
						newlisting.imageId = imagePublicIdArray;
						console.log('image info: ',newlisting.image,'imageid info:',newlisting.imageId)
					}else if(listingGallery[i].mimetype.includes('video')) {
						console.log('video uploading');
						var videoUpload = await uploadToCloudinary(listingGallery[i].path); 
						videoSecureUrlArray.push(videoUpload.secure_url);
						videoPublicIdArray.push(videoUpload.public_id);
						newlisting.video = videoSecureUrlArray;
						newlisting.videoId = videoPublicIdArray;
						console.log('video info: ',newlisting.video,'videoid info:',newlisting.videoId)
					}
				}
			}catch(err) {
				console.log('gallery error: ',err.message);
				req.flash("error", "Please provide 2 or more media files.");
				return res.redirect('back');	
			}

			//create the listing
			listing.create(newlisting, async function(err, newlyCreated){
				if(err)
				{
					console.log(err);
				} else {
					let user = await User.findById(req.user._id).populate('followers').exec();
					// console.log("id" + newlyCreated)
					// console.log("listingThumbnail" + newlyCreated.thumbnail)
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

//New Route
router.get("/listings/new", middleware.isLoggedIn, middleware.isAdminAgent, function(req,res){
	res.render("listings/new.ejs");
});

//Show Route
router.get("/listings/:id", function(req, res){ 
  listing.findById(req.params.id).populate("comments likes").exec(function(err, foundlisting){
		if(err){
			res.redirect("/listings");
		} else{
			var id = req.params.id;
			countApi("/hit/3dpropertylistingsg/" +  id).then(success => {
				console.log("https://api.countapi.xyz/hit/3dpropertylistingsg/" + id);
				console.log(success.data.value);
			});

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
router.put("/listings/:id", middleware.checklistingOwnership, uploadMultiple, function(req, res){
	listing.findById(req.params.id, async function(err, listing){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			//Thumbnail
			//File Input populated => new file
			if(req.files.listingThumbnail) {
				var listingThumbnail = req.files.listingThumbnail;
				try{
					console.log('check for thumbnail: '+listing.thumbnailId);
					await cloudinary.v2.uploader.destroy(listing.thumbnailId);
					console.log('thumbnail path check: '+listingThumbnail[0].path);
					var result = await uploadToCloudinary(listingThumbnail[0].path);
					listing.thumbnail = result.secure_url;
					listing.thumbnailId = result.public_id;
				}catch(err) {
					req.flash("error", err.message);
					return res.redirect("back");
				}
			}else {
				if(req.body.prevThumbnail) {
					listing.thumbnail = req.body.prevThumbnail;
				}
				if(req.body.prevThumbnailId) {
					listing.thumbnailId = req.body.prevThumbnailId;
				}
			}

			//Previous Image
			var newListingImageIdArr = [];
			if(req.body.prevImageId) {
				var listingImageId = req.body.prevImageId.split(",");
				for(let i=0; i<listingImageId.length; i++) {
					newListingImageIdArr.push(listingImageId[i])
				}
			}
			var newListingImageArr = [];
			if(req.body.prevImage) {
				var listingImage = req.body.prevImage.split(",");
				for(let i=0; i<listingImage.length; i++) {
					newListingImageArr.push(listingImage[i])
				}		
			}
			//Previous Video		
			var newListingVideoIdArr = [];
			if(req.body.prevVideoId) {
				var listingVideoId = req.body.prevVideoId.split(",");
				for(let i=0; i<listingVideoId.length; i++) {
					newListingVideoIdArr.push(listingVideoId[i])
				}	
			}
			var newListingVideoArr = [];
			if(req.body.prevVideo) {
				var listingVideo = req.body.prevVideo.split(",");
				for(let i=0; i<listingVideo.length; i++) {
					newListingVideoArr.push(listingVideo[i])
				}		
			}
			//Deleted Previous Image & Video ID
			var deleteImageIdArr = [];
			if(req.body.dltPrevImageId) {
				var deleteImageId = req.body.dltPrevImageId.split(",");
				for(let i=0; i<deleteImageId.length; i++) {
					deleteImageIdArr.push(deleteImageId[i])
				}	
			}
			var deleteVideoIdArr = [];
			if(req.body.dltPrevVideoId) {
				var deleteVideoId = req.body.dltPrevVideoId.split(",");
				for(let i=0; i<deleteVideoId.length; i++) {
					deleteVideoIdArr.push(deleteVideoId[i])
				}	
			}

			//Image & Video Gallery
			if(req.files.listingGallery) {
				var listingGallery = req.files.listingGallery;
				console.log('new upda gallery: ', listingGallery);
				var newImageSecureUrlArray = [];
				var newImagePublicIdArray = [];
				var newVideoSecureUrlArray = [];
				var newVideoPublicIdArray = [];
				try{
					//Destroy Image
					console.log('check for image: '+listing.imageId);
					// for(let i=0; i<listing.imageId.length; i++) {
					// 	await cloudinary.v2.uploader.destroy(listing.imageId[i]);
					// }
					for(let i=0; i<deleteImageIdArr.length; i++) {
						await cloudinary.v2.uploader.destroy(deleteImageIdArr[i]);
					}
					//Destroy Video
					console.log('check for video: '+listing.videoId);
					// for(let i=0; i<listing.videoId.length; i++) {
					// 	await cloudinary.v2.uploader.destroy(listing.videoId[i]);
					// }
					for(let i=0; i<deleteImageIdArr.length; i++) {
						await cloudinary.v2.uploader.destroy(deleteImageIdArr[i]);
					}

					//Upload Image & Video
					for(let i=0; i<listingGallery.length; i++) {
						if(listingGallery[i].mimetype.includes('image')) {
							var result = await uploadToCloudinary(listingGallery[i].path);
							newImageSecureUrlArray.push(result.secure_url);
							newImagePublicIdArray.push(result.public_id);
						}else if(listingGallery[i].mimetype.includes('video')) {
							var result = await uploadToCloudinary(listingGallery[i].path);
							newVideoSecureUrlArray.push(result.secure_url);
							newVideoPublicIdArray.push(result.public_id);
						}
					}
					//Image
					for(let i=0; i<newImageSecureUrlArray.length; i++) {
						newListingImageArr.push(newImageSecureUrlArray[i])
					}
					for(let i=0; i<newImagePublicIdArray.length; i++) {
						newListingImageIdArr.push(newImagePublicIdArray[i])
					}
					//Video
					for(let i=0; i<newVideoSecureUrlArray.length; i++) {
						newListingVideoArr.push(newVideoSecureUrlArray[i])
					}
					for(let i=0; i<newVideoPublicIdArray.length; i++) {
						newListingVideoIdArr.push(newVideoPublicIdArray[i])
					}
					// listing.image = newImageSecureUrlArray;
					// listing.imageId = newImagePublicIdArray;
					// listing.video = newVideoSecureUrlArray;
					// listing.videoId = newVideoPublicIdArray;		
				}catch(err) {
					req.flash("error", err.message);
					return res.redirect("back");
				}
			}
			console.log('111111: ', newListingImageArr)
			console.log('222222: ', newListingImageIdArr)
			console.log('333333: ', newListingVideoArr)
			console.log('444444: ', newListingVideoIdArr)

			//Set Image and video id and stuff
			listing.image = newListingImageArr;
			listing.imageId = newListingImageIdArr;
			listing.video = newListingVideoArr;
			listing.videoId = newListingVideoIdArr;		

			
			//location information
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
			//Get all the information
			listing.name = req.body.listing.name;
			listing.price = req.body.listing.price;
			listing.size = req.body.listing.size;
			listing.type = req.body.listing.type;
			listing.bedrooms = Number(req.body.listing.bedrooms);
			listing.bathrooms = Number(req.body.listing.bathrooms);
			listing.tenure = req.body.listing.tenure;
			listing.zone = req.body.listing.zone;
			listing.district = req.body.listing.district;
			listing.street = req.body.listing.street;
			listing.unitNumber = req.body.listing.unitNumber;
			listing.location = req.body.listing.location;
			listing.threeDImage = req.body.listing.threeDImage;
			listing.description = req.body.listing.description;
			//radio buttons input (true/false)
			listing.carpark = req.body.listing.carpark;
			listing.pool = req.body.listing.pool;
			listing.gym = req.body.listing.gym;
			listing.playground = req.body.listing.playground;
			listing.hall = req.body.listing.hall;
			listing.mall = req.body.listing.mall;
			listing.intercom = req.body.listing.intercom;
			listing.security = req.body.listing.security;
			//save new listing information
			listing.save();
			console.log(listing)
			req.flash("success", "You have successfully updated a listing.");
			res.redirect("/listings/" + listing._id);
		}
	});
});

//Delete Route
router.delete("/listings/:id", middleware.checklistingOwnership, function(req, res){
	//Delete Listing
	listing.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/listings");
		} else{
			req.flash("success", "You have successfully deleted a listing.");
			res.redirect("/listings");
		}
	});

	//Remove Comments using listing id
	Comment.remove( { "author.listingId": req.params.id } ).populate('author.listingId').exec(function (err, dltComment) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from comments: ', dltComment);
		}
	});
});
//Delete Route at Dashboard
router.delete("/listings/:id/dashboard", middleware.checklistingOwnership, function(req, res){
	//Delete Listing
	listing.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/listings");
		} else{
			req.flash("success", "You have successfully deleted a listing.");
			res.redirect("/dashboard/listings");
		}
	});
	
	//Remove Comments using listing id
	Comment.remove( { "author.listingId": req.params.id } ).populate('author.listingId').exec(function (err, dltComment) {
		if(err) {
			res.redirect("/user");
		}else {
			console.log('removed from comments: ', dltComment);
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

//Mark listing as sold
router.get("/listings/:id/sold", middleware.checklistingOwnership, function(req, res){
	listing.findById(req.params.id).populate("comments likes").exec(function(err, foundlisting){
		if(err){
			res.redirect("/listings");
		} else{
			console.log('the one we tryna sell: ',foundlisting);
			console.log('listing sold status: ',foundlisting.soldStatus);
			foundlisting.soldStatus = true;
			console.log('check if listing is marked as sold: '+foundlisting.soldStatus);
			foundlisting.save();
			res.render("listings/show.ejs", {listing: foundlisting});
		}
	});
});
router.get("/listings/:id/unsold", middleware.checklistingOwnership, function(req, res){
	listing.findById(req.params.id).populate("comments likes").exec(function(err, foundlisting){
		if(err){
			res.redirect("/listings");
		} else{
			console.log('the one we tryna sell: ',foundlisting);
			console.log('listing sold status: ',foundlisting.soldStatus);
			foundlisting.soldStatus = false;
			console.log('check if listing is marked as sold: '+foundlisting.soldStatus);
			foundlisting.save();
			res.render("listings/show.ejs", {listing: foundlisting});
		}
	});
});

//Archive Listing
router.get("/listings/:id/archive", middleware.checklistingOwnership, function(req, res){
	listing.findById(req.params.id).populate("comments likes").exec(function(err, foundlisting){
		if(err){
			res.redirect("/listings");
		} else{
			console.log('the one we tryna archive: ',foundlisting);
			console.log('listing archive status: ',foundlisting.archiveStatus);
			foundlisting.archiveStatus = true;
			console.log('check if listing is marked as archive: '+foundlisting.archiveStatus);
			foundlisting.save();
			res.render("listings/show.ejs", {listing: foundlisting});
		}
	});
});
//Unarchive Listing
router.get("/listings/:id/unarchive", middleware.checklistingOwnership, function(req, res){
	listing.findById(req.params.id).populate("comments likes").exec(function(err, foundlisting){
		if(err){
			res.redirect("/listings");
		} else{
			console.log('the one we tryna archive: ',foundlisting);
			console.log('listing archive status: ',foundlisting.archiveStatus);
			foundlisting.archiveStatus = false;
			console.log('check if listing is marked as archive: '+foundlisting.archiveStatus);
			foundlisting.save();
			res.render("listings/show.ejs", {listing: foundlisting});
		}
	});
});

//Get Listing for chat
router.get('/listing/:listingId', async function(req, res) {
	const id = req.params.listingId
	try {
		const listing1 = await listing.findById(id)
		res.status(200).json(listing1);
		// console.log(user)
	  } catch (err) {
		res.status(500).json(err);
	  }
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