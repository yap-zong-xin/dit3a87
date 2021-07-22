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
		if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/i)) {
			return cb(new Error('Only [jpg/jpeg/png/gif] image files are allowed!'), false);
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
			if(req.query.search) {
					const regex = new RegExp(escapeRegex(req.query.search), 'gi');
					listing.find({$or: [{name: regex}, {description: regex}, {"author.username":regex}]}).populate('author.id').exec(function (err, alllistings) {
						listing.count({name: regex}).exec(function (err, count) {
								if (err) {
										console.log(err);
										res.redirect("back");
								} else {
										if(alllistings.length < 1) {
												noMatch = "result: '" + req.query.search + "' not found";
										}
										//====== for listing analytics
										for (var i = 0; i < alllistings.length; i++) {
											//id
											var id = alllistings[i]._id;
											console.log(alllistings[i]._id);

											async function postCount (id) {
												await countApi("/hit/3dpropertylistingsg/" +  id + "-click").then(success => {
												// console.log("https://api.countapi.xyz/hit/3dpropertylistingsg/" + id + "-click");
												// console.log("id: " + id + "success: " + success.data.value);
												});
											}
											postCount(id);
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
				
				// District 
				const northDistrict = req.query.northDistrict;
				const southDistrict = req.query.southDistrict;
				const eastDistrict = req.query.eastDistrict;
				const westDistrict = req.query.westDistrict;
				var allDistrict = [];
				allDistrict.push(northDistrict, southDistrict, eastDistrict, westDistrict);
				console.log('all District: '+allDistrict);
				var districtArr=[];
				var regexDistrict;
				var count = 0;
				for(let i=0; i<allDistrict.length; i++) {
					if(typeof allDistrict[i]=='undefined'){
						console.log('counting rooms')
						count++;
					}
				}
				if(count == 4){
					allDistrict = [ 'north', 'south', 'east', 'west' ];
					regexDistrict = allDistrict.map(function(e){return new RegExp(e, "gi");});
					console.log('inside District all empty: '+regexDistrict);
				}else {
					for(let i=0; i<allDistrict.length; i++) {
						if(!(typeof allDistrict[i] == 'undefined')) { //contains value does not contain undefined
							console.log('district at i: '+allDistrict[i]);
							districtArr[i] = allDistrict[i];
							console.log('inside District: '+districtArr);
							var districtArrRegex = districtArr.map(function(e){return new RegExp(e, "gi");});
							regexDistrict = districtArrRegex.filter(function(el){
								return el != null && el != '';
							})
							console.log('regexDistrict: '+regexDistrict)
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
							console.log('rooms at i: '+allRooms[i]);
							roomsArr[i] = Number(allRooms[i]);
							console.log('inside rooms: '+roomsArr);
							// var roomsArrRegex = roomsArr.map(function(e){return new RegExp(e, "gi");});
							regexRooms = roomsArr.filter(function(elt){
								return elt != null && elt != '';
							})
							console.log('regexRooms: '+regexRooms)
						}

					}
				}
				//number of bath rooms
				const onebathrooms = req.query.onebathrooms;
				const twobathrooms = req.query.twobathrooms;
				const threebathrooms = req.query.threebathrooms;
				var allbathRooms = [];
				allbathRooms.push(onebathrooms, twobathrooms, threebathrooms);
				console.log('all bath rooms: '+allbathRooms);
				var bathroomsArr=[];
				var regexbathRooms;
				var bathroomCount = 0;
				for(let i=0; i<allbathRooms.length; i++) {
					if(typeof allbathRooms[i]=='undefined'){
						console.log('counting bath rooms')
						bathroomCount++;
					}
				}
				if(bathroomCount == 3){
					regexbathRooms = [ 1, 2, 3 ];
					console.log('inside bath room all empty: '+typeof regexbathRooms[1]);
				}else {
					for(let i=0; i<allbathRooms.length; i++) {
						if(!(typeof allbathRooms[i] == 'undefined')) { //contains value does not contain undefined
							console.log('line bath: '+allbathRooms[i]);
							bathroomsArr[i] = allbathRooms[i];
							console.log('inside bath rooms: '+bathroomsArr);
							regexbathRooms = bathroomsArr.filter(function(elto){
								return elto != null && elto != '';
							})
							console.log('regexbathRooms: '+regexbathRooms)
						}

					}
				}
				//Tenure
				const freehold = req.query.freehold;
				const NinetyNineYL = req.query.NinetyNineYL;
				const HundredThreeYL = req.query.HundredThreeYL;
				const HundredTenYL = req.query.HundredTenYL;
				const NineHundredNineYL = req.query.NineHundredNineYL;
				const tenure = req.query.tenure;
				var allTenure = [];
				allTenure.push(freehold, NinetyNineYL, HundredThreeYL, HundredTenYL, NineHundredNineYL, tenure);
				console.log('all tenure: '+allTenure);
				var tenureArr=[];
				var regexTenure;
				var tenureCount = 0;
				for(let i=0; i<allTenure.length; i++) {
					if(typeof allTenure[i]=='undefined'){
						console.log('counting tenure')
						tenureCount++;
					}
				}
				if(tenureCount == 6){
					allTenure = [ 'freehold', 'ninetynine', 'hundredthree', 'hundredten', 'ninehundrednine', 'unknown' ];
					regexTenure = allTenure.map(function(e){return new RegExp(e, "gi");});
					console.log('inside Tenure all empty: '+regexTenure);
				}else {
					for(let i=0; i<allTenure.length; i++) {
						if(!(typeof allTenure[i] == 'undefined')) { //contains value does not contain undefined
							console.log('tenure at i: '+allTenure[i]);
							tenureArr[i] = allTenure[i];
							console.log('inside tenure: '+tenureArr);
							var tenureArrRegex = tenureArr.map(function(e){return new RegExp(e, "gi");});
							regexTenure = tenureArrRegex.filter(function(lp){
								return lp != null && lp != '';
							})
							console.log('regex tenure: '+regexTenure)
						}

					}
				}

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
				var regexSold = [];
				var regexArchive = [];
				if(soldCheck){ //if sold is check, show sold and not sold only
					regexSold.push(true);
					regexSold.push(false);
				}else {
					regexSold.push(false);
				}
				if(archiveCheck){
					regexArchive.push(true);
					regexArchive.push(false);
				}else {
					regexArchive.push(false);
				}


				console.log('final sort option object: ',sortOptions);
				console.log('passed in sold check: ',regexSold)
				console.log('passed in archive check: ',regexArchive)
				console.log('all parameters passed to mongo: '+minPrice+', '+maxPrice+', '+regexDistrict+', '+regexType+', '+minSize+', '+maxSize+', '+regexRooms);

				listing.find({$and: [ {price: {$gte: minPrice, $lte: maxPrice}}, {district: {$in : regexDistrict}}, {type: {$in: regexType}}, {size: {$gte: minSize, $lte: maxSize}}, {bedrooms: {$in: regexRooms}}, {bathrooms: {$in: regexbathRooms}}, {tenure: {$in: regexTenure}}, {soldStatus: {$in: regexSold}}, {archiveStatus: {$in: regexArchive}} ] }).sort(sortOptions).populate('author.id').exec(function (err, alllistings) {
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
			} else if (req.query.search == "") {
					// get all listings from DB
					listing.find({$and: [{soldStatus: false}, {archiveStatus: false}] })
					.sort({createdAt: -1})
					.populate('author.id')
					.exec(function (err, alllistings) {
							listing.count().exec(function (err, count) {
									if (err) {
											console.log(err);
									} else {
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
										res.render("listings/search.ejs", {
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
			
			} else {
					// get all listings from DB
					listing.find({$and: [{soldStatus: false}, {archiveStatus: false}] })
					.sort({createdAt: -1})
					.limit(10)
					.populate('author.id')
					.exec(function (err, alllistings) {
							listing.count().exec(function (err, count) {
									if (err) {
											console.log(err);
									} else {
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

	//counts number of times homepage has been visited
	countApi("/hit/3dpropertylistingsg/visits").then(success => {
		// console.log(success.data.value);
	});
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Post Route
// router.post("/listings", middleware.isLoggedIn, uploadMultiple, async function(req,res){
// 	var thumbnail = req.files.thumbnail;
// 	console.log('thumbnail sdkadnfj: '+thumbnail[0].path);

// 	var imageArray = req.files.image;

// 	var fileArray = [];
// 	for(let i = 0 ; i < imageArray.length; i++) {
// 		fileArray.push(req.files.image[i]);
// 	}
// 	if (req.files.video) {
// 		var videoArray = req.files.video;
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
// 	var bedrooms = req.body.bedrooms;
// 	var bathrooms = req.body.bathrooms;
//   	var author = {
// 		id: req.user._id,
// 		username: req.user.username
// 	};
// 	var newlisting = {name:name, description:desc, author:author, location:location, zone:zone, price:price, size:size, type:type, bedrooms:bedrooms, bathrooms:bathrooms}
// 	try {
// 			var geoData = await geocodingClient.forwardGeocode({
// 				query: location,
// 				autocomplete: false,
// 		    limit: 1
// 		  })
// 		  .send();
// 			newlisting.geometry = geoData.body.features[0].geometry;
// 			// console.log(newlisting.geometry);

// 			//1 thumbnail image upload to cloudinary
// 			var thumbnailUpload = await uploadToCloudinary(thumbnail[0].path, { resource_type: "auto" });
// 			console.log('thumbnail upload await: ',thumbnailUpload);
// 			var thumbnailSecureUrl = thumbnailUpload.secure_url;
// 			var thumbnailPublicId = thumbnailUpload.public_id;
// 			newlisting.thumbnail = thumbnailSecureUrl;
// 			newlisting.thumbnailId = thumbnailPublicId;

// 		  	//image/videos upload to cloudinary
// 			for(let i=0; i<fileArray.length; i++) {
// 				if(fileArray[i].fieldname == 'image') {
// 					console.log('image uploading');
// 					var imageUpload = await uploadToCloudinary(fileArray[i].path); 
// 					imageSecureUrlArray.push(imageUpload.secure_url);
// 					imagePublicIdArray.push(imageUpload.public_id);
// 					newlisting.image = imageSecureUrlArray;
// 					newlisting.imageId = imagePublicIdArray;
// 					console.log('image info: ',newlisting.image,'imageid info:',newlisting.imageId)
// 				}else if(fileArray[i].fieldname == 'video') {
// 					console.log('video uploading');
// 					var videoUpload = await uploadToCloudinary(fileArray[i].path); 
// 					videoSecureUrlArray.push(videoUpload.secure_url);
// 					videoPublicIdArray.push(videoUpload.public_id);
// 					newlisting.video = videoSecureUrlArray;
// 					newlisting.videoId = videoPublicIdArray;
// 					console.log('video info: ',newlisting.video,'videoid info:',newlisting.videoId)
// 				}
// 			}

// 			//create the listing
// 			listing.create(newlisting, async function(err, newlyCreated){
// 				if(err)
// 				{
// 					console.log(err);
// 				} else {
// 					let user = await User.findById(req.user._id).populate('followers').exec();
// 					//console.log("id" + newlyCreated._id)
// 					let newNotification = {
// 						username: req.user.username,
// 						image: req.user.image,
// 						listingId: newlyCreated._id,
// 						idUser: newlyCreated.author.id,
// 						listingImage: newlyCreated.thumbnail
// 					}
// 					for(const follower of user.followers) {
// 						let notification = await Notification.create(newNotification);
// 						follower.notifications.push(notification);
// 						follower.save();
// 					}
// 					req.flash("success", "You have successfully added a listing.");
// 					res.redirect(`/listings/${newlyCreated._id}`);
// 				}
// 			});
// 		} catch (err){
// 			console.log('try catch error: ',err.message);
// 			res.redirect('back');
// 		}
// });

router.post("/listings", middleware.isLoggedIn, uploadMultiple, async function(req,res){
	// uploadMultiple(req, res, function (err) {
	// 	if (err instanceof multer.MulterError) {
	// 	  // A Multer error occurred when uploading.
	// 	  console.log('multer err: ', err instanceof multer.MulterError)
	// 	} else if (err) {
	// 	  // An unknown error occurred when uploading.
	// 		console.log('unknow multer err: ',err)
	// 	}
	// 	console.log('fine');
	// 	// Everything went fine.
	//   })

	// var fs = require('fs');
	// console.log('fs files open: ',fs.open());
	console.log('the files: ',req.files);//JSON.parse(JSON.stringify(req.files))
	// if(req.files.listingThumbnail) {
		var listingThumbnail = req.files.listingThumbnail;
		console.log('listingThumbnail sdkadnfj: '+listingThumbnail[0].path);
	// }
	// if(req.files.listingGallery) {
		var listingGallery = req.files.listingGallery;
		console.log('files got what: ',listingGallery);
	// }
	// if(req.files.imageGallery) {
	// 	var imageFiles = req.files.imageGallery;
	// 	console.log('imagessssssssss: '+imageFiles);
	// }
	// if(req.files.videoGallery) {
	// 	var videoFiles = req.files.videoGallery;
	// 	console.log('videossssssssss: '+videoFiles);
	// }

	// var imageArray = req.files.image;

	// var fileArray = [];
	// for(let i = 0 ; i < imageArray.length; i++) {
	// 	fileArray.push(req.files.image[i]);
	// }
	// if (req.files.video) {
	// 	var videoArray = req.files.video;
	// 	for(let i = 0 ; i < videoArray.length; i++) {
	// 		fileArray.push(req.files.video[i]);
	// 	}
	// }

	var imageSecureUrlArray = [];
	var imagePublicIdArray = [];
	var videoSecureUrlArray = [];
	var videoPublicIdArray = [];

	var name = req.body.name;
	var desc = req.body.description;
	var location = req.body.location;
	var unitNumber = req.body.unitNumber;
	var street = req.body.street;
	var district = req.body.district;
	var price = req.body.price;
	var size = req.body.size;
	var type = req.body.type;
	var bedrooms = Number(req.body.bedrooms);
	var bathrooms = Number(req.body.bathrooms);
	var tenure = req.body.tenure;
	var threeDImage = req.body.threeDImage;
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
	var newlisting = {name:name, description:desc, author:author, location:location, unitNumber:unitNumber, street:street, district:district, price:price, size:size, type:type, bedrooms:bedrooms, bathrooms:bathrooms, tenure:tenure, threeDImage:threeDImage}
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
			var geoData = await geocodingClient.forwardGeocode({
				query: location,
				autocomplete: false,
		    limit: 1
		  })
		  .send();
			newlisting.geometry = geoData.body.features[0].geometry;
			// console.log(newlisting.geometry);

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
						listingImage: newlyCreated.listingThumbnail
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
router.get("/listings/new", middleware.isLoggedIn, function(req,res){

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
// router.put("/listings/:id", middleware.checklistingOwnership, uploadMultiple, function(req, res){
// 	listing.findById(req.params.id, async function(err, listing){
// 		if(err){
// 			req.flash("error", err.message);
// 			res.redirect("back");
// 		} else{
// 			// console.log(listing)
// 			if(req.files){
// 				//Thumbnail
// 				if(req.files.thumbnail) {
// 					var newThumbnail = req.files.thumbnail;
// 					console.log('new thumbnail object: '+newThumbnail);
// 					try{
// 						console.log('check for: '+listing.thumbnailId);
// 						await cloudinary.v2.uploader.destroy(listing.thumbnailId);
// 						console.log('paht check: '+newThumbnail[0].path);
// 						var result = await cloudinary.v2.uploader.upload(newThumbnail[0].path, { resource_type: "auto" });
// 						listing.thumbnail = result.secure_url;
// 						listing.thumbnailId = result.public_id;
// 					}catch(err) {
// 						req.flash("error", err.message);
// 						return res.redirect("back");
// 					}
// 				}
// 				//Image
// 				if(req.files.image) {
// 					var newImage = req.files.image;
// 					var newImageArray = [];
// 					for(let a=0; a<newImage.length; a++) {
// 						newImageArray.push(newImage[a]);
// 					}
// 					// console.log('new image array length: ',newImageArray.length);
// 					// console.log('new image stuff: ',newImageArray[0].path);
// 					var newImageSecureUrlArray = [];
// 					var newImagePublicIdArray = [];
// 					try{
// 						// console.log('check for: '+listing.imageId[0]);
// 						for(let b=0; b<listing.imageId.length; b++) {
// 							await cloudinary.v2.uploader.destroy(listing.imageId[b]);
// 						}
						
// 						for(let c=0; c<newImageArray.length; c++) {
// 							console.log('image paht check: ',newImageArray[c].path);
// 							var result = await cloudinary.v2.uploader.upload(newImageArray[c].path, { resource_type: "auto" });
// 							newImageSecureUrlArray.push(result.secure_url);
// 							newImagePublicIdArray.push(result.public_id);
// 							listing.image = newImageSecureUrlArray;
// 							listing.imageId = newImagePublicIdArray;
// 						}
// 					}catch(err) {
// 						req.flash("error", err.message);
// 						return res.redirect("back");
// 					}
// 				}
// 				//Video
// 				if(req.files.video) {
// 					var newVideo = req.files.video;
// 					var newVideoArray = [];
// 					for(let d=0; d<newVideo.length; d++) {
// 						newVideoArray.push(newVideo[d]);
// 					}
// 					// console.log('new video array length: ',newVideoArray.length);
// 					// console.log('new video stuff: ',newVideoArray[0].path);
// 					var newVideoSecureUrlArray = [];
// 					var newVideoPublicIdArray = [];
// 					try{
// 						// console.log('check for: '+listing.videoId[0]);
// 						for(let p=0; p<listing.videoId.length; p++) {
// 							await cloudinary.v2.uploader.destroy(listing.videoId[p]);
// 						}
						
// 						for(let k=0; k<newVideoArray.length; k++) {
// 							console.log('vide paht check: ',newVideoArray[k].path);
// 							var result = await cloudinary.v2.uploader.upload(newVideoArray[k].path, { resource_type: "auto" });
// 							newVideoSecureUrlArray.push(result.secure_url);
// 							newVideoPublicIdArray.push(result.public_id);
// 							listing.video = newVideoSecureUrlArray;
// 							listing.videoId = newVideoPublicIdArray;
// 						}
// 					}catch(err) {
// 						req.flash("error", err.message);
// 						return res.redirect("back");
// 					}
// 				}
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
// 			listing.bedrooms = req.body.listing.bedrooms;
// 			listing.save();
// 			console.log(listing)
// 			req.flash("success", "You have successfully updated a listing.");
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
			//if thumbnail is provided
			if(req.files.listingThumbnail) {
				var listingThumbnail = req.files.listingThumbnail;
				try{
					console.log('check for: '+listing.thumbnailId);
					await cloudinary.v2.uploader.destroy(listing.thumbnailId);
					console.log('paht check: '+listingThumbnail[0].path);
					var result = await cloudinary.v2.uploader.upload(listingThumbnail[0].path, { resource_type: "auto" });
					listing.thumbnail = result.secure_url;
					listing.thumbnailId = result.public_id;
				}catch(err) {
					req.flash("error", err.message);
					return res.redirect("back");
				}
			}
			if(req.files.listingGallery) {
				console.log('new edit listing gallery: ', req.files.listingGallery);
			}	
			// //Image
			// var newImage = req.files.image;
			// var newImageArray = [];
			// for(let a=0; a<newImage.length; a++) {
			// 	newImageArray.push(newImage[a]);
			// }
			// // console.log('new image array length: ',newImageArray.length);
			// // console.log('new image stuff: ',newImageArray[0].path);
			// var newImageSecureUrlArray = [];
			// var newImagePublicIdArray = [];
			// try{
			// 	// console.log('check for: '+listing.imageId[0]);
			// 	for(let b=0; b<listing.imageId.length; b++) {
			// 		await cloudinary.v2.uploader.destroy(listing.imageId[b]);
			// 	}
				
			// 	for(let c=0; c<newImageArray.length; c++) {
			// 		console.log('image paht check: ',newImageArray[c].path);
			// 		var result = await cloudinary.v2.uploader.upload(newImageArray[c].path, { resource_type: "auto" });
			// 		newImageSecureUrlArray.push(result.secure_url);
			// 		newImagePublicIdArray.push(result.public_id);
			// 		listing.image = newImageSecureUrlArray;
			// 		listing.imageId = newImagePublicIdArray;
			// 	}
			// }catch(err) {
			// 	req.flash("error", err.message);
			// 	return res.redirect("back");
			// }
				
			// //Video
			// var newVideo = req.files.video;
			// var newVideoArray = [];
			// for(let d=0; d<newVideo.length; d++) {
			// 	newVideoArray.push(newVideo[d]);
			// }
			// // console.log('new video array length: ',newVideoArray.length);
			// // console.log('new video stuff: ',newVideoArray[0].path);
			// var newVideoSecureUrlArray = [];
			// var newVideoPublicIdArray = [];
			// try{
			// 	// console.log('check for: '+listing.videoId[0]);
			// 	for(let p=0; p<listing.videoId.length; p++) {
			// 		await cloudinary.v2.uploader.destroy(listing.videoId[p]);
			// 	}
				
			// 	for(let k=0; k<newVideoArray.length; k++) {
			// 		console.log('vide paht check: ',newVideoArray[k].path);
			// 		var result = await cloudinary.v2.uploader.upload(newVideoArray[k].path, { resource_type: "auto" });
			// 		newVideoSecureUrlArray.push(result.secure_url);
			// 		newVideoPublicIdArray.push(result.public_id);
			// 		listing.video = newVideoSecureUrlArray;
			// 		listing.videoId = newVideoPublicIdArray;
			// 	}
			// }catch(err) {
			// 	req.flash("error", err.message);
			// 	return res.redirect("back");
			// }
				
			//location and save
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
			listing.bedrooms = req.body.listing.bedrooms;
			listing.save();
			console.log(listing)
			req.flash("success", "You have successfully updated a listing.");
			res.redirect("/listings/" + listing._id);
		}
	});
});

//Delete Route
router.delete("/listings/:id", function(req, res){
	listing.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/listings");
		} else{
			req.flash("success", "You have successfully deleted a listing.");
			res.redirect("/listings");
		}
	});
});
//Delete Route at Dashboard
router.delete("/listings/:id/dashboard", function(req, res){
	listing.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/listings");
		} else{
			req.flash("success", "You have successfully deleted a listing.");
			res.redirect("/dashboard/listings");
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